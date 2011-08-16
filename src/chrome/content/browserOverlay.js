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

var TiltChrome = TiltChrome || {};
var EXPORTED_SYMBOLS = ["TiltChrome.BrowserOverlay"];

/**
 * Controls the browser overlay for the Tilt extension.
 */
TiltChrome.BrowserOverlay = {

  /**
   * Content location href of the current tab generating the visualization.
   */
  href: null,

  /**
   * The canvas element used for rendering the visualization.
   */
  canvas: null,

  /*
   * Visualization logic and drawing loop.
   */
  visualization: null,

  /**
   * The popup panel containing the Ace Cloud9 editor in an iframe.
   */
  sourceEditor: null,

  /**
   * A popup panel containing a simple color picker.
   */
  colorPicker: null,

  /**
   * Initializes Tilt.
   * @param {object} event: the event firing this function
   */
  initialize: function(event) {
    // first, close the visualization and clean up any mess if there was any
    this.destroy(true);

    // if the page was just visualized, leave the visualization destroyed
    // this happens if Tilt is opened and closed in the same tab
    if (this.href === window.content.location.href) {
      this.href = null; // forget the current tab location
    }
    else {
      // the current tab has a new page, so recreate the entire visualization
      // remember the current tab location
      this.href = window.content.location.href;

      // retain the panels for future reference (used by the code editor)
      this.sourceEditor = {
        panel: document.getElementById("tilt-sourceeditor"),
        title: document.getElementById("tilt-sourceeditor-title"),
        iframe: document.getElementById("tilt-sourceeditor-iframe")
      };

      this.colorPicker = {
        panel: document.getElementById("tilt-colorpicker"),
        iframe: document.getElementById("tilt-colorpicker-iframe")
      };

      // remember the refresh functions from the panels iframes
      this.sourceEditor.refresh = 
        this.sourceEditor.iframe.contentWindow.refreshCodeEditor;

      this.colorPicker.refresh = 
        this.colorPicker.iframe.contentWindow.refreshColorPicker;

      // get the iframe which will be used to create the canvas element
      var iframe = document.getElementById("tilt-iframe"),

      // set the width and height to mach the content window dimensions
      width = window.content.innerWidth,
      height = window.content.innerHeight;

      // inside a chrome environment the default document and parent nodes
      // are different from an unprivileged html page, so change these
      Tilt.Document.currentContentDocument = iframe.contentDocument;
      Tilt.Document.currentParentNode = gBrowser.selectedBrowser.parentNode;

      // initialize the canvas element used to draw the visualization
      this.canvas = Tilt.Document.initCanvas(width, height, true);

      // construct the visualization using the canvas
      this.visualization =
        new TiltChrome.Visualization(this.canvas,
        new TiltChrome.Controller.MouseAndKeyboard(),
        new TiltChrome.UI.Default());
    }
  },

  /**
   * Destroys this object, removes the iframe and sets all members to null.
   *
   * @param {Boolean} gc: pass true to do a garbage collection when finished
   * @param {Boolean} timeout: pass true to do the heavy lifting in a timeout
   */
  destroy: function(gc, timeout) {
    // the document and parent nodes won't be used anymore, so nullify them
    Tilt.Document.currentContentDocument = null;
    Tilt.Document.currentParentNode = null;

    // quickly remove the canvas from the selected browser parent node
    if (this.canvas !== null) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }

    // remove any remaining traces of popups and the visualization
    var finish = function() {
      if (this.visualization !== null) {
        this.visualization.destroy();
        this.visualization = null;
      }
      if (this.sourceEditor !== null) {      
        this.sourceEditor.panel.hidePopup();
        this.sourceEditor.panel = null;
        this.sourceEditor.title = null;
        this.sourceEditor.iframe = null;
        this.sourceEditor = null;
      }
      if (this.colorPicker !== null) {
        this.colorPicker.panel.hidePopup();
        this.colorPicker.panel = null;
        this.colorPicker.iframe = null;
        this.colorPicker = null;
      }

      // if the build was in debug mode (profiling enabled), log some
      // information about the intercepted function
      Tilt.Profiler.log();
      Tilt.Profiler.reset();

      // if specified, do a garbage collection when everything is over
      if (gc) {
        window.setTimeout(this.performGC, 100);
      }
    }.bind(this);

    // finishing the cleanup may take some time, so set a small timeout
    if (timeout) {
      window.setTimeout(finish, 100);
    }
    else {
      // the finish timeout wasn't explicitly requested, continue normally
      finish();
    }
  },

  /**
   * Forces a garbage collection.
   */
  performGC: function() {
    window.QueryInterface(Ci.nsIInterfaceRequestor).
      getInterface(Ci.nsIDOMWindowUtils).
      garbageCollect();
  }
};
