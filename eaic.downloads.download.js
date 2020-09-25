const fs = require('fs');
const path = require('path');
const os = require('os');

const downloadFileSync = require('download-file-sync');
const request = require('request');
const parser = require('fast-xml-parser');
const he = require('he');

const archiver = require('archiver');

const cacheDir = __dirname + "/cache" //os.tmpdir();

const kml_json_options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false, //"strict"
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
    tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
    stopNodes: ["parse-me-as-string"]
};

const deleteFolderRecursive = function (folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
};

const download = function (uri, filename, callback) {
    request.head(uri, function () {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

function processKML(address, path, callback) {
    const kmlRaw = downloadFileSync(address);
    if (parser.validate(kmlRaw) === true) { // optional (it'll return an object in case it's not valid)
        let kml = parser.parse(kmlRaw, kml_json_options);
        const dynamicAddress = kml.kml.Document.NetworkLink.Link.href;
        if (dynamicAddress != null)
            download(dynamicAddress, path.format("kmz"), function () {
                callback(null);
            });
        else {
            fs.writeFileSync(path.format("kml"), kmlRaw);
            callback(null);
        }
    } else
        callback("no_valid_kml");
}

function processSector(mysql, sourceDir, param, id, callback) {
    const sectorSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `{0}`='{1}';"
        .format(param, id);
    mysql.query(sectorSql, function (error, result) {
        let counter = 0
        const toCount = result.length
        if (error)
            callback(error)
        else if (result.length > 0) {
            for (const c in result)
                if (result.hasOwnProperty(c)) {
                    const sectorRaw = JSON.stringify(result[c]);
                    const sector = JSON.parse(sectorRaw);
                    const sectorId = sector.id;

                    const sectorFilePath = path.join(sourceDir, `sector_${sectorId}.json`);

                    const sectorImageAddress = sector.image;
                    const sectorImageExtension = sectorImageAddress.split(".").pop();
                    const sectorImageParentPath = path.join(sourceDir, 'images/sector');
                    const sectorImagePath = path.join(sectorImageParentPath, `${sectorId}.${sectorImageExtension}`);

                    const pathsSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `sector_id`='{0}';"
                        .format(sectorId);
                    mysql.query(pathsSql, function (error, result) {
                        if (error)
                            callback(error)
                        else {
                            const paths = []
                            for (const c in result)
                                if (result.hasOwnProperty(c)) {
                                    const pathRaw = JSON.stringify(result[c]);
                                    const path = JSON.parse(pathRaw);

                                    paths.push(path);
                                }

                            sector["paths"] = paths;
                            fs.writeFileSync(sectorFilePath, JSON.stringify(sector)); // Write sector data

                            fs.mkdirSync(sectorImageParentPath, {recursive: true})
                            download(sectorImageAddress, sectorImagePath, function () {
                                counter++
                                if (counter >= toCount)
                                    callback()
                            })
                        }
                    })
                }
        } else callback("zone_not_found")
    })
}

function processZone(mysql, sourceDir, param, id, callback) {
    const zoneSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_zones` WHERE `{0}`='{1}';"
        .format(param, id);
    mysql.query(zoneSql, function (error, result) {
        let counter = 0
        const toCount = result.length
        if (error)
            callback(error)
        else if (toCount > 0) {
            for (const c in result)
                if (result.hasOwnProperty(c)) {
                    const zoneRaw = JSON.stringify(result[c]);
                    const zone = JSON.parse(zoneRaw);
                    const zoneId = zone.id;

                    const zoneFilePath = path.join(sourceDir, `zone_${zoneId}.json`);
                    const zoneKMLPath = path.join(sourceDir, `zone_${zoneId}.{0}`);

                    fs.writeFileSync(zoneFilePath, zoneRaw); // Write zone data

                    const zoneImageExtension = zone.image.split(".").pop();
                    const zoneImageParentPath = path.join(sourceDir, 'images/zone');
                    const zoneImagePath = path.join(zoneImageParentPath, `${zoneId}.${zoneImageExtension}`);

                    fs.mkdirSync(zoneImageParentPath, {recursive: true})
                    download(zone.image, zoneImagePath, function () {
                        processKML(zone.kml_address, zoneKMLPath, function () {
                            processSector(mysql, sourceDir, "climbing_zone", zoneId, function () {
                                counter++
                                if (counter >= toCount)
                                    callback()
                            })
                        });
                    })
                }
        } else callback("zone_not_found")
    })
}

function processArea(mysql, sourceDir, areaId, callback) {
    const areaSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_areas` WHERE `id`='{0}';"
        .format(areaId);
    mysql.query(areaSql, function (error, result) {
        if (error)
            callback(error)
        else if (result.length > 0) {
            const areaFilePath = path.join(sourceDir, `area_${areaId}.json`);
            const areaKMLPath = path.join(sourceDir, `area_${areaId}.{0}`);

            const areaRaw = JSON.stringify(result[0]);
            const area = JSON.parse(areaRaw);
            fs.writeFileSync(areaFilePath, areaRaw); // Write area data

            const areaImageExtension = area.image.split(".").pop();
            const areaImageParentPath = path.join(sourceDir, 'images/area');
            const areaImagePath = path.join(areaImageParentPath, `${areaId}.${areaImageExtension}`);

            fs.mkdirSync(areaImageParentPath, {recursive: true})
            download(area.image, areaImagePath, function () {
                processKML(area.kml_address, areaKMLPath, function (error) {
                    if (error) return callback(error)

                    processZone(mysql, sourceDir, "area_id", areaId, callback)
                });
            })
        } else callback("area_not_found")
    })
}

module.exports = class DownloadsToken {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const token = params.token;

        const findTokenSql = "SELECT `id`, `download` FROM `EscalarAlcoiaIComtat`.`download_tokens` WHERE `token`='{0}' AND `used`='0';"
            .format(token)
        mysql.query(findTokenSql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else if (result.length > 0) {
                const res = result[0];
                const tableId = res.id;
                const download = res.download;
                const key = download[0];
                const id = download.substr(1)

                const consumeTokenSql = "UPDATE `EscalarAlcoiaIComtat`.`download_tokens` SET `used`='1' WHERE `id`='{0}';"
                    .format(tableId)

                const tokenDirPath = path.join(cacheDir, token)
                fs.mkdirSync(tokenDirPath, {recursive: true});

                const zipFilePath = path.join(cacheDir, `${token}.zip`)

                if (fs.existsSync(tokenDirPath))
                    deleteFolderRecursive(tokenDirPath)
                fs.mkdirSync(tokenDirPath, {recursive: true})
                if (fs.existsSync(zipFilePath))
                    fs.unlinkSync(zipFilePath)

                function packAndGo() {
                    const outputZip = fs.createWriteStream(zipFilePath)
                    const archive = archiver('zip', {
                        zlib: {level: 9} // Sets the compression level.
                    })

                    outputZip.on('close', function () {
                        console.log(archive.pointer() + ' total bytes');
                        console.log('archiver has been finalized and the output file descriptor has closed.');

                        if (fs.existsSync(zipFilePath))
                            mysql.query(consumeTokenSql, function (error, result) {
                                if (error)
                                    response.status(500).send({error: error});
                                else
                                    response.download(zipFilePath);
                            })
                        else response.status(500).send({error: "cloud_not_zip"});
                    })

                    archive.on('warning', function (err) {
                        return response.status(500).send({error: err});
                    });
                    archive.on('error', function (err) {
                        return response.status(500).send({error: err});
                    });

                    archive.pipe(outputZip);
                    archive.directory(tokenDirPath, false);
                    archive.finalize();
                }

                if (key === 'A')
                    processArea(mysql, tokenDirPath, id, function (error) {
                        if (error)
                            return response.status(500).send({error: error});

                        packAndGo()
                    })
                else if (key === 'Z')
                    processZone(mysql, tokenDirPath, "id", id, function (error) {
                        if (error)
                            return response.status(500).send({error: error});

                        packAndGo()
                    })
                else if (key === 'S')
                    processSector(mysql, tokenDirPath, "id", id, function (error) {
                        if (error)
                            return response.status(500).send({error: error});

                        packAndGo()
                    })
            } else
                response.status(400).send({error: "token_not_found"});
        });
    }
}