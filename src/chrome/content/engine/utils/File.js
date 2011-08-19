/***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Tilt: A WebGL-based 3D visualization of a webpage.
 *
 * The Initial Developer of the Original Code is Victor Porof.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the LGPL or the GPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 ***** END LICENSE BLOCK *****/
"use strict";

var Tilt = Tilt || {};
var EXPORTED_SYMBOLS = ["Tilt.File"];

Tilt.File = {

  /**
   * Shows a file picker and returns the result.
   *
   * @param {String} type: either "file" or "folder"
   * @return {Object} the picked file if the returned OK, null otherwise
   */
  showPicker: function(type) {
    var fp, res, folder;

    fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    fp.init(window, "Select the folder to save the 3D webpage", 
      type === "folder" ? Ci.nsIFilePicker.modeGetFolder :
                          Ci.nsIFilePicker.modeOpen);

    if ((res = fp.show()) == Ci.nsIFilePicker.returnOK) {
      return fp.file;
    }
    else {
      return null;
    }
  },

  /**
   * Saves data into a file placed on the desktop.
   *
   * @param {String} data: the contents
   * @param {String} path: the path of the file
   */
  save: function(data, path) {
    var file, ostream, istream, converter;

    Cu["import"]("resource://gre/modules/FileUtils.jsm");
    Cu["import"]("resource://gre/modules/NetUtil.jsm");

    file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);

    ostream = FileUtils.openSafeFileOutputStream(file);

    converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
      createInstance(Ci.nsIScriptableUnicodeConverter);
  
    converter.charset = "UTF-8";
    istream = converter.convertToInputStream(data);

    NetUtil.asyncCopy(istream, ostream, function(status) {
      if (!Components.isSuccessCode(status)) {
        return;
      }
    });  
  },

  /**
   * Saves an image into a file placed on the desktop.
   *
   * @param {String} canvas: the contents
   * @param {String} path: the path of the file
   */
  saveImage: function(canvas, path) {
    var file, io, source, target, persist;

    Cu["import"]("resource://gre/modules/FileUtils.jsm");
    Cu["import"]("resource://gre/modules/NetUtil.jsm");

    file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);

    io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

    source = io.newURI(canvas.toDataURL("image/png", ""), "UTF8", null);
    target = io.newFileURI(file);

    persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].
      createInstance(Ci.nsIWebBrowserPersist);

    persist.persistFlags = Ci.nsIWebBrowserPersist.
      PERSIST_FLAGS_REPLACE_EXISTING_FILES;

    persist.persistFlags |= Ci.nsIWebBrowserPersist.
      PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

    persist.saveURI(source, null, null, null, null, file);
  }
};
