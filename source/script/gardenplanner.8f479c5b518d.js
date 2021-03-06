/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Contains some common methods available to all log appenders.
 */
qx.Bootstrap.define("qx.log.appender.Util",
{
  statics :
  {
    /**
     * Converts a single log entry to HTML
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    toHtml : function(entry)
    {
      var output = [];
      var item, msg, sub, list;

      output.push("<span class='offset'>", this.formatOffset(entry.offset, 6), "</span> ");

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push("<span class='object' title='Object instance with hash code: " + obj.$$hash + "'>", obj.classname, "[" , obj.$$hash, "]</span>: ");
        }
      }
      else if (entry.clazz)
      {
        output.push("<span class='object'>" + entry.clazz.classname, "</span>: ");
      }

      var items = entry.items;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (msg instanceof Array)
        {
          var list = [];

          for (var j=0, jl=msg.length; j<jl; j++)
          {
            sub = msg[j];
            if (typeof sub === "string") {
              list.push("<span>" + this.escapeHTML(sub) + "</span>");
            } else if (sub.key) {
              list.push("<span class='type-key'>" + sub.key + "</span>:<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            } else {
              list.push("<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            }
          }

          output.push("<span class='type-" + item.type + "'>");

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }

          output.push("</span>");
        }
        else
        {
          output.push("<span class='type-" + item.type + "'>" + this.escapeHTML(msg) + "</span> ");
        }
      }

      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = output.join("");
      wrapper.className = "level-" + entry.level;

      return wrapper;
    },


    /**
     * Formats a numeric time offset to 6 characters.
     *
     * @param offset {Integer} Current offset value
     * @param length {Integer?6} Refine the length
     * @return {String} Padded string
     */
    formatOffset : function(offset, length)
    {
      var str = offset.toString();
      var diff = (length||6) - str.length;
      var pad = "";

      for (var i=0; i<diff; i++) {
        pad += "0";
      }

      return pad+str;
    },


    /**
     * Escapes the HTML in the given value
     *
     * @param value {String} value to escape
     * @return {String} escaped value
     */
    escapeHTML : function(value) {
      return String(value).replace(/[<>&"']/g, this.__escapeHTMLReplace);
    },


    /**
     * Internal replacement helper for HTML escape.
     *
     * @param ch {String} Single item to replace.
     * @return {String} Replaced item
     */
    __escapeHTMLReplace : function(ch)
    {
      var map =
      {
        "<" : "&lt;",
        ">" : "&gt;",
        "&" : "&amp;",
        "'" : "&#39;",
        '"' : "&quot;"
      };

      return map[ch] || "?";
    },


    /**
     * Converts a single log entry to plain text
     *
     * @param entry {Map} The entry to process
     * @return {String} the formatted log entry
     */
    toText : function(entry) {
      return this.toTextArray(entry).join(" ");
    },


    /**
     * Converts a single log entry to an array of plain text
     *
     * @param entry {Map} The entry to process
     * @return {Array} Argument list ready message array.
     */
    toTextArray : function(entry)
    {
      var output = [];

      output.push(this.formatOffset(entry.offset, 6));

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push(obj.classname + "[" + obj.$$hash + "]:");
        }
      }
      else if (entry.clazz) {
        output.push(entry.clazz.classname + ":");
      }

      var items = entry.items;
      var item, msg;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (item.trace && item.trace.length > 0) {
          if (typeof(this.FORMAT_STACK) == "function") {
            qx.log.Logger.deprecatedConstantWarning(qx.log.appender.Util,
              "FORMAT_STACK",
              "Use qx.dev.StackTrace.FORMAT_STACKTRACE instead");
            msg += "\n" + this.FORMAT_STACK(item.trace);
          } else {
            msg += "\n" + item.trace;
          }
        }

        if (msg instanceof Array)
        {
          var list = [];
          for (var j=0, jl=msg.length; j<jl; j++) {
            list.push(msg[j].text);
          }

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }
        }
        else
        {
          output.push(msg);
        }
      }

      return output;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Processes the incoming log entry and displays it by means of the native
 * logging capabilities of the client.
 *
 * Supported browsers:
 * * Firefox <4 using FireBug (if available).
 * * Firefox >=4 using the Web Console.
 * * WebKit browsers using the Web Inspector/Developer Tools.
 * * Internet Explorer 8+ using the F12 Developer Tools.
 * * Opera >=10.60 using either the Error Console or Dragonfly
 *
 * Currently unsupported browsers:
 * * Opera <10.60
 *
 * @require(qx.log.appender.Util)
 * @require(qx.bom.client.Html)
 */
qx.Bootstrap.define("qx.log.appender.Native",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      if (qx.core.Environment.get("html.console")) {
        // Firefox 4's Web Console doesn't support "debug"
        var level = console[entry.level] ? entry.level : "log";
        if (console[level]) {
          var args = qx.log.appender.Util.toText(entry);
          console[level](args);
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.log.Logger.register(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Feature-rich console appender for the qooxdoo logging system.
 *
 * Creates a small inline element which is placed in the top-right corner
 * of the window. Prints all messages with a nice color highlighting.
 *
 * * Allows user command inputs.
 * * Command history enabled by default (Keyboard up/down arrows).
 * * Lazy creation on first open.
 * * Clearing the console using a button.
 * * Display of offset (time after loading) of each message
 * * Supports keyboard shortcuts F7 or Ctrl+D to toggle the visibility
 *
 * @require(qx.event.handler.Window)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Gesture)
 */
qx.Class.define("qx.log.appender.Console",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
      INITIALIZATION AND SHUTDOWN
    ---------------------------------------------------------------------------
    */

   __main : null,

   __log : null,

   __cmd : null,

   __lastCommand : null,

    /**
     * Initializes the console, building HTML and pushing last
     * log messages to the output window.
     *
     */
    init : function()
    {
      // Build style sheet content
      var style =
      [
        '.qxconsole{z-index:10000;width:600px;height:300px;top:0px;right:0px;position:absolute;border-left:1px solid black;color:black;border-bottom:1px solid black;color:black;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',

        '.qxconsole .control{background:#cdcdcd;border-bottom:1px solid black;padding:4px 8px;}',
        '.qxconsole .control a{text-decoration:none;color:black;}',

        '.qxconsole .messages{background:white;height:100%;width:100%;overflow:auto;}',
        '.qxconsole .messages div{padding:0px 4px;}',

        '.qxconsole .messages .user-command{color:blue}',
        '.qxconsole .messages .user-result{background:white}',
        '.qxconsole .messages .user-error{background:#FFE2D5}',
        '.qxconsole .messages .level-debug{background:white}',
        '.qxconsole .messages .level-info{background:#DEEDFA}',
        '.qxconsole .messages .level-warn{background:#FFF7D5}',
        '.qxconsole .messages .level-error{background:#FFE2D5}',
        '.qxconsole .messages .level-user{background:#E3EFE9}',
        '.qxconsole .messages .type-string{color:black;font-weight:normal;}',
        '.qxconsole .messages .type-number{color:#155791;font-weight:normal;}',
        '.qxconsole .messages .type-boolean{color:#15BC91;font-weight:normal;}',
        '.qxconsole .messages .type-array{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-map{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-key{color:#565656;font-style:italic}',
        '.qxconsole .messages .type-class{color:#5F3E8A;font-weight:bold}',
        '.qxconsole .messages .type-instance{color:#565656;font-weight:bold}',
        '.qxconsole .messages .type-stringify{color:#565656;font-weight:bold}',

        '.qxconsole .command{background:white;padding:2px 4px;border-top:1px solid black;}',
        '.qxconsole .command input{width:100%;border:0 none;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',
        '.qxconsole .command input:focus{outline:none;}'
      ];

      // Include stylesheet
      qx.bom.Stylesheet.createElement(style.join(""));

      // Build markup
      var markup =
      [
        '<div class="qxconsole">',
        '<div class="control"><a href="javascript:qx.log.appender.Console.clear()">Clear</a> | <a href="javascript:qx.log.appender.Console.toggle()">Hide</a></div>',
        '<div class="messages">',
        '</div>',
        '<div class="command">',
        '<input type="text"/>',
        '</div>',
        '</div>'
      ];

      // Insert HTML to access DOM node
      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = markup.join("");
      var main = wrapper.firstChild;
      document.body.appendChild(wrapper.firstChild);

      // Make important DOM nodes available
      this.__main = main;
      this.__log = main.childNodes[1];
      this.__cmd = main.childNodes[2].firstChild;

      // Correct height of messages frame
      this.__onResize();

      // Finally register to log engine
      qx.log.Logger.register(this);

      // Register to object manager
      qx.core.ObjectRegistry.register(this);
    },


    /**
     * Used by the object registry to dispose this instance e.g. remove listeners etc.
     *
     */
    dispose : function()
    {
      qx.event.Registration.removeListener(document.documentElement, "keypress", this.__onKeyPress, this);
      qx.log.Logger.unregister(this);
    },





    /*
    ---------------------------------------------------------------------------
      INSERT & CLEAR
    ---------------------------------------------------------------------------
    */

    /**
     * Clears the current console output.
     *
     */
    clear : function()
    {
      // Remove all messages
      this.__log.innerHTML = "";
    },


    /**
     * Processes a single log entry
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      // Append new content
      this.__log.appendChild(qx.log.appender.Util.toHtml(entry));

      // Scroll down
      this.__scrollDown();
    },


    /**
     * Automatically scroll down to the last line
     */
    __scrollDown : function() {
      this.__log.scrollTop = this.__log.scrollHeight;
    },





    /*
    ---------------------------------------------------------------------------
      VISIBILITY TOGGLING
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Flag to store last visibility status */
    __visible : true,


    /**
     * Toggles the visibility of the console between visible and hidden.
     *
     */
    toggle : function()
    {
      if (!this.__main)
      {
        this.init();
      }
      else if (this.__main.style.display == "none")
      {
        this.show();
      }
      else
      {
        this.__main.style.display = "none";
      }
    },


    /**
     * Shows the console.
     *
     */
    show : function()
    {
      if (!this.__main) {
        this.init();
      } else {
        this.__main.style.display = "block";
        this.__log.scrollTop = this.__log.scrollHeight;
      }
    },


    /*
    ---------------------------------------------------------------------------
      COMMAND LINE SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Array} List of all previous commands. */
    __history : [],


    /**
     * Executes the currently given command
     *
     */
    execute : function()
    {
      var value = this.__cmd.value;
      if (value == "") {
        return;
      }

      if (value == "clear") {
        this.clear();
        return;
      }

      var command = document.createElement("div");
      command.innerHTML = qx.log.appender.Util.escapeHTML(">>> " + value);
      command.className = "user-command";

      this.__history.push(value);
      this.__lastCommand = this.__history.length;
      this.__log.appendChild(command);
      this.__scrollDown();

      try {
        var ret = window.eval(value);
      }
      catch (ex) {
        qx.log.Logger.error(ex);
      }

      if (ret !== undefined) {
        qx.log.Logger.debug(ret);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for resize listener
     *
     * @param e {Event} Event object
     */
    __onResize : function(e) {
      this.__log.style.height = (this.__main.clientHeight - this.__main.firstChild.offsetHeight - this.__main.lastChild.offsetHeight) + "px";
    },


    /**
     * Event handler for keydown listener
     *
     * @param e {Event} Event object
     */
    __onKeyPress : function(e)
    {
      if (e instanceof qx.event.type.Tap || e instanceof qx.event.type.Pointer) {
        var target = e.getTarget();
        if (target && target.className && target.className.indexOf && target.className.indexOf("navigationbar") != -1) {
          this.toggle();
        }
        return;
      }

      var iden = e.getKeyIdentifier();

      // Console toggling
      if ((iden == "F7") || (iden == "D" && e.isCtrlPressed()))
      {
        this.toggle();
        e.preventDefault();
      }

      // Not yet created
      if (!this.__main) {
        return;
      }

      // Active element not in console
      if (!qx.dom.Hierarchy.contains(this.__main, e.getTarget())) {
        return;
      }

      // Command execution
      if (iden == "Enter" && this.__cmd.value != "")
      {
        this.execute();
        this.__cmd.value = "";
      }

      // History managment
      if (iden == "Up" || iden == "Down")
      {
        this.__lastCommand += iden == "Up" ? -1 : 1;
        this.__lastCommand = Math.min(Math.max(0, this.__lastCommand), this.__history.length);

        var entry = this.__history[this.__lastCommand];
        this.__cmd.value = entry || "";
        this.__cmd.select();
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addListener(document.documentElement, "keypress", statics.__onKeyPress, statics);
    qx.event.Registration.addListener(document.documentElement, "longtap", statics.__onKeyPress, statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Alexander Steitz (aback)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Modern color theme
 */
qx.Theme.define("qx.theme.modern.Color",
{
  colors :
  {
    /*
    ---------------------------------------------------------------------------
      BACKGROUND COLORS
    ---------------------------------------------------------------------------
    */

    // application, desktop, ...
    "background-application" : "#DFDFDF",

    // pane color for windows, splitpanes, ...
    "background-pane" : "#F3F3F3",

    // textfields, ...
    "background-light" : "#FCFCFC",

    // headers, ...
    "background-medium" : "#EEEEEE",

    // splitpane
    "background-splitpane" : "#AFAFAF",

    // tooltip, ...
    "background-tip" : "#ffffdd",

    // error tooltip
    "background-tip-error": "#C72B2B",

    // tables, ...
    "background-odd" : "#E4E4E4",

    // progress bar
    "progressbar-background" : "white",




    /*
    ---------------------------------------------------------------------------
      TEXT COLORS
    ---------------------------------------------------------------------------
    */

    // other types
    "text-light" : "#909090",
    "text-gray" : "#4a4a4a",

    // labels
    "text-label" : "#1a1a1a",

    // group boxes
    "text-title" : "#314a6e",

    // text fields
    "text-input" : "#000000",

    // states
    "text-hovered"  : "#001533",
    "text-disabled" : "#7B7A7E",
    "text-selected" : "#fffefe",
    "text-active"   : "#26364D",
    "text-inactive" : "#404955",
    "text-placeholder" : "#CBC8CD",






    /*
    ---------------------------------------------------------------------------
      BORDER COLORS
    ---------------------------------------------------------------------------
    */

    "border-inner-scrollbar" : "white",

    // menus, tables, scrollbars, list, etc.
    "border-main" : "#4d4d4d",
    "menu-separator-top" : "#C5C5C5",
    "menu-separator-bottom" : "#FAFAFA",

    // between toolbars
    "border-separator" : "#808080",
    "border-toolbar-button-outer" : "#b6b6b6",
    "border-toolbar-border-inner" : "#f8f8f8",
    "border-toolbar-separator-right" : "#f4f4f4",
    "border-toolbar-separator-left" : "#b8b8b8",

    // text fields
    "border-input" : "#334866",
    "border-inner-input" : "white",

    // disabled text fields
    "border-disabled" : "#B6B6B6",

    // tab view, window
    "border-pane" : "#00204D",

    // buttons
    "border-button" : "#666666",

    // tables (vertical line)
    "border-column" : "#CCCCCC",

    // focus state of text fields
    "border-focused" : "#99C3FE",

    // invalid form widgets
    "invalid" : "#990000",
    "border-focused-invalid" : "#FF9999",

    // drag & drop
    "border-dragover" : "#33508D",

    "keyboard-focus" : "black",


    /*
    ---------------------------------------------------------------------------
      TABLE COLORS
    ---------------------------------------------------------------------------
    */

    // equal to "background-pane"
    "table-pane" : "#F3F3F3",

    // own table colors
    // "table-row-background-selected" and "table-row-background-focused-selected"
    // are inspired by the colors of the selection decorator
    "table-focus-indicator" : "#0880EF",
    "table-row-background-focused-selected" : "#084FAB",
    "table-row-background-focused" : "#80B4EF",
    "table-row-background-selected" : "#084FAB",

    // equal to "background-pane" and "background-odd"
    "table-row-background-even" : "#F3F3F3",
    "table-row-background-odd" : "#E4E4E4",

    // equal to "text-selected" and "text-label"
    "table-row-selected" : "#fffefe",
    "table-row" : "#1a1a1a",

    // equal to "border-collumn"
    "table-row-line" : "#CCC",
    "table-column-line" : "#CCC",

    "table-header-hovered" : "white",

    /*
    ---------------------------------------------------------------------------
      PROGRESSIVE TABLE COLORS
    ---------------------------------------------------------------------------
    */

    "progressive-table-header"              : "#AAAAAA",
    "progressive-table-header-border-right" : "#F2F2F2",


    "progressive-table-row-background-even" : "#F4F4F4",
    "progressive-table-row-background-odd"  : "#E4E4E4",

    "progressive-progressbar-background"         : "gray",
    "progressive-progressbar-indicator-done"     : "#CCCCCC",
    "progressive-progressbar-indicator-undone"   : "white",
    "progressive-progressbar-percent-background" : "gray",
    "progressive-progressbar-percent-text"       : "white",


    /*
    ---------------------------------------------------------------------------
      CSS ONLY COLORS
    ---------------------------------------------------------------------------
    */
    "selected-start" : "#004DAD",
    "selected-end" : "#00368A",
    "background-selected" : "#00368A",

    "tabview-background" : "#07125A",

    "shadow" : qx.core.Environment.get("css.rgba") ? "rgba(0, 0, 0, 0.4)" : "#999999",

    "pane-start" : "#FBFBFB",
    "pane-end" : "#F0F0F0",

    "group-background" : "#E8E8E8",
    "group-border" : "#B4B4B4",

    "radiobutton-background" : "#EFEFEF",

    "checkbox-border" : "#314A6E",
    "checkbox-focus" : "#87AFE7",
    "checkbox-hovered" : "#B2D2FF",
    "checkbox-hovered-inner" : "#D1E4FF",
    "checkbox-inner" : "#EEEEEE",
    "checkbox-start" : "#E4E4E4",
    "checkbox-end" : "#F3F3F3",
    "checkbox-disabled-border" : "#787878",
    "checkbox-disabled-inner" : "#CACACA",
    "checkbox-disabled-start" : "#D0D0D0",
    "checkbox-disabled-end" : "#D8D8D8",
    "checkbox-hovered-inner-invalid" : "#FAF2F2",
    "checkbox-hovered-invalid" : "#F7E9E9",

    "radiobutton-checked" : "#005BC3",
    "radiobutton-disabled" : "#D5D5D5",
    "radiobutton-checked-disabled" : "#7B7B7B",
    "radiobutton-hovered-invalid" : "#F7EAEA",

    "tooltip-error" : "#C82C2C",

    "scrollbar-start" : "#CCCCCC",
    "scrollbar-end" : "#F1F1F1",
    "scrollbar-slider-start" : "#EEEEEE",
    "scrollbar-slider-end" : "#C3C3C3",

    "button-border-disabled" : "#959595",
    "button-start" : "#F0F0F0",
    "button-end" : "#AFAFAF",
    "button-disabled-start" : "#F4F4F4",
    "button-disabled-end" : "#BABABA",
    "button-hovered-start" : "#F0F9FE",
    "button-hovered-end" : "#8EB8D6",
    "button-focused" : "#83BAEA",

    "border-invalid" : "#930000",

    "input-start" : "#F0F0F0",
    "input-end" : "#FBFCFB",
    "input-focused-start" : "#D7E7F4",
    "input-focused-end" : "#5CB0FD",
    "input-focused-inner-invalid" : "#FF6B78",
    "input-border-disabled" : "#9B9B9B",
    "input-border-inner" : "white",

    "toolbar-start" : "#EFEFEF",
    "toolbar-end" : "#DDDDDD",

    "window-border" : "#00204D",
    "window-border-caption" : "#727272",
    "window-caption-active-text" : "white",
    "window-caption-active-start" : "#084FAA",
    "window-caption-active-end" : "#003B91",
    "window-caption-inactive-start" : "#F2F2F2",
    "window-caption-inactive-end" : "#DBDBDB",
    "window-statusbar-background" : "#EFEFEF",

    "tabview-start" : "#FCFCFC",
    "tabview-end" : "#EEEEEE",
    "tabview-inactive" : "#777D8D",
    "tabview-inactive-start" : "#EAEAEA",
    "tabview-inactive-end" : "#CECECE",

    "table-header-start" : "#E8E8E8",
    "table-header-end" : "#B3B3B3",

    "menu-start" : "#E8E8E9",
    "menu-end" : "#D9D9D9",
    "menubar-start" : "#E8E8E8",

    "groupitem-start" : "#A7A7A7",
    "groupitem-end" : "#949494",
    "groupitem-text" : "white",
    "virtual-row-layer-background-even" : "white",
    "virtual-row-layer-background-odd" : "white"
  }
});
