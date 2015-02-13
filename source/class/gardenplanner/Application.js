/* ************************************************************************

   Copyright:

   License:

   Authors: Jonathan Wolfe - February 2015

************************************************************************ */

/**
 * This is the main application class of your custom application "GardenPlanner"
 *
 * @asset(gardenplanner/*)
 */
qx.Class.define("gardenplanner.Application",
{
  extend : qx.application.Standalone,

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     *
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;

        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */
      var mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
      var controlsContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      mainContainer.setMargin(20);
      controlsContainer.add(new qx.ui.basic.Label('<b>Select Your Last Freeze Date:</b>').set(
      {
        rich : true,
        font : new qx.bom.Font(20),
        textColor : "rgb(0, 105, 207)"
      }));

      // Initialize the datefield with a reasonable date
      var year = new Date().getFullYear();
      var dateField = new qx.ui.form.DateField();
      dateField.setValue(new Date(year, 03, 1));
      dateField.addListener("changeValue", function(e)
      {
        var lastFrostDate = e.getData();
        var weeks = [10, 12];  // 10 to 12 weeks
        this.plotMe("cal", lastFrostDate, weeks);
        var weeks = [8, 10];
        this.plotMe("cal1", lastFrostDate, weeks);
        var weeks = [6, 8];
        this.plotMe("cal2", lastFrostDate, weeks);
        var weeks = [4, 6];
        this.plotMe("cal3", lastFrostDate, weeks);
        var weeks = [2, 4];
        this.plotMe("cal4", lastFrostDate, weeks);
      }, this);
      controlsContainer.add(dateField);

      // Make the html container
      var htmlDiv = new qx.ui.embed.Html('<div id="main"></div>').set(
      {
        minHeight : 800,
        minWidth : 1200,
        paddingTop : 20
      });
      htmlDiv.setOverflow("auto", "auto");

      // A button to start over...
      var startOver = new qx.ui.form.Button("Start Over");
      startOver.addListener("execute", function()
      {
        htmlDiv.resetHtml();
        htmlDiv.setHtml('<div id="main"></div>');
      });
      controlsContainer.add(startOver);
      mainContainer.add(controlsContainer);
      mainContainer.add(new qx.ui.basic.Label('<b>After you select a date, calendars will appear below highlighting the periods when you should plant seeds inside before a frost date. <br>The red box is today\'s date while the black one is your selected date.</b>').set(
      {
        rich : true,
        font : new qx.bom.Font(14),
        textColor : "rgb(58, 160, 67)"
      }));
      mainContainer.add(htmlDiv, {
        flex : 1
      });
      this.getRoot().add(mainContainer);
    },

    /**
    Plot the data - this could be written a lot better, but I just wanted to get something working before this springs seed season...
    */
    plotMe : function(id, lastFrostDate, weeks)
    {
      var data = [
      {
        "label" : "cal",
        "text" : "10-12 weeks",  // <img src='https://pbs.twimg.com/profile_images/429072172200390656/a0LbiXxg_normal.jpeg'><img src='http://vignette1.wikia.nocookie.net/chefville/images/1/15/Ingredient-Wild_Onion.png/revision/latest/scale-to-width/40?cb=20121106205432'>
        "img" : ""
      },
      {
        "label" : "cal1",
        "text" : "8-10 weeks",
        "img" : "sugar.jpg"
      },
      {
        "label" : "cal2",
        "text" : "6-8 weeks",
        "img" : "sugar.jpg"
      },
      {
        "label" : "cal3",
        "text" : "4-6 weeks",
        "img" : "sugar.jpg"
      },
      {
        "label" : "cal4",
        "text" : "2-4 weeks",
        "img" : "sugar.jpg"
      }];

      // Make a div
      var diventer = d3.select("#main").selectAll("div").data(data).enter().append("div").attr("id", function(d) {
        return d.label;
      }).attr("class", 'graphs');
      diventer.append("p").html(function(d) {
        return "<b>" + d.text + "</b>";
      });

      // Make the data object
      var datas = [];
      var x = d3.range(0, (weeks[1] - weeks[0]) * 7);
      x.forEach(function(obj) {
        datas.push(
        {
          date : parseInt(lastFrostDate.getTime() / 1000) - weeks[1] * 7 * 86400 + 86400 * obj,  // <---- go back the number of weeks from the selected date
          value : 10  // just chose ten for a nice lime green color
        });
      });

      // Calendar data parser
      var parser = function(data)
      {
        var stats = {

        };
        for (var d in data) {
          stats[data[d].date] = data[d].value;
        }
        return stats;
      };

      /**
      Make the calendar
      */
      var cal = new CalHeatMap();
      cal.init(
      {
        itemSelector : "#" + id,
        start : new Date(2015, 0),
        domain : "month",
        subDomain : "x_day",
        cellSize : 20,
        subDomainTextFormat : "%e",
        range : 6,
        displayLegend : false,
        data : datas,
        afterLoadData : parser,
        dataType : "json",
        weekStartOnMonday : false,
        highlight : [new Date(), lastFrostDate]
      });
    }
  }
});
