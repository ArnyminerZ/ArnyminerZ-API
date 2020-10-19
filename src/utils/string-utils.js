/**
 * This file contains some utilities for working with Strings
 *
 * @author ArnyminerZ
 * @version 1 2020/10/15
 * @file string-utils.js
 */


/**
 * Formats the String replacing placeholders named {n} where n is the argument index
 * @return {string}
 */
String.prototype.format = function () {
    const args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match;
    });
};

module.exports = {
    /**
     * Returns the extension of a file
     * @param path {String} The file path
     * @return {string} The extension of the file
     */
    getFileExtension: (path) => {
        const re = /(?:\.([^.]+))?$/;
        return re.exec(path)[1]
    },
    /**
     * Replaces the file extension from its path
     * @param path {String} The full path of the file
     * @param newExtension {String} The new extension to set
     * @return {String} The modified path
     */
    changeFileExtension: (path, newExtension) => {
        const pieces = path.split('.')
        const extension = pieces[pieces.length - 1]
        return path.replace(extension, '') + newExtension
    }
}
