'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var Pipeline = GltfPipeline.Pipeline;
var addCesiumRTC = GltfPipeline.addCesiumRTC;
var getBinaryGltf = GltfPipeline.getBinaryGltf;
var parseBinaryGltf = GltfPipeline.parseBinaryGltf;

module.exports = optimizeGlb;

/**
 * Given an input buffer containing a binary glTF asset, optimize it using gltf-pipeline with the provided options
 *
 * @param {Buffer} buffer The buffer containing the binary glTF.
 * @param {Object} [options] Options specifying custom gltf-pipeline behavior.
 * @returns {Promise} A promise that resolves to the optimized binary glTF.
 */
function optimizeGlb(glbBuffer, options) {
    if (!defined(options)) {
        options = GltfPipeline.parseArguments(['-i', 'null']);
    }
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }
    var rtcPosition;
    var gltf = parseBinaryGltf(glbBuffer);
    var extensions = gltf.extensions;
    if (defined(extensions)) {
        // If it is used, extract the CesiumRTC extension and add it back after processing
        var cesiumRTC = extensions.CESIUM_RTC;
        if (defined(cesiumRTC)) {
            rtcPosition = Cartesian3.unpack(cesiumRTC.center);
        }
    }
    return Pipeline.processJSONWithExtras(gltf, options)
        .then(function(gltf) {
            if (defined(rtcPosition)) {
                addCesiumRTC(gltf, {
                    position: rtcPosition
                });
            }
            var embed = defaultValue(options.embed, true);
            var embedImage = defaultValue(options.embedImage, true);
            return getBinaryGltf(gltf, embed, embedImage).glb;
        })
        .catch(function(err) {
            console.log(err);
        });
}