/* ************************************************************************

   Copyright:

   License:

   Authors:

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
      var mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var controlsContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      mainContainer.setMargin(20);
      controlsContainer.add(new qx.ui.basic.Label('<b>Select Your Last Freeze Date:</b>').set(
      {
        rich : true,
        font : new qx.bom.Font(20),
        textColor : "rgb(0, 105, 207)"
      }));
      var year = new Date().getFullYear();
      var dateField = new qx.ui.form.DateField();
      dateField.setValue(new Date(year, 03, 25));
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
      var htmlDiv = new qx.ui.embed.Html('<div id="main"></div>').set(
      {
        minHeight : 800,
        minWidth : 800,
        paddingTop : 20
      });
      htmlDiv.setOverflow("auto", "auto");
      var startOver = new qx.ui.form.Button("Start Over");
      startOver.addListener("execute", function() {
        htmlDiv.resetHtml();
        htmlDiv.setHtml('<div id="main"></div>');
      });
      controlsContainer.add(startOver);
      mainContainer.add(controlsContainer);
      mainContainer.add(htmlDiv, {
        flex : 1
      });
      this.getRoot().add(mainContainer);
    },
    plotMe : function(id, lastFrostDate, weeks)
    {
      var data = [
      {
        "label" : "cal",
        "text" : "10-12 weeks <img src='https://pbs.twimg.com/profile_images/429072172200390656/a0LbiXxg_normal.jpeg'><img src='http://vignette1.wikia.nocookie.net/chefville/images/1/15/Ingredient-Wild_Onion.png/revision/latest/scale-to-width/40?cb=20121106205432'>",
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
      var diventer = d3.select("#main").selectAll("div").data(data).enter().append("div").attr("id", function(d) {
        return d.label;
      }).attr("class", 'graphs');
      diventer.append("p").html(function(d) {
        return d.text;
      });
      var datas = [];
      var x = d3.range(0, (weeks[1] - weeks[0]) * 7);
      x.forEach(function(obj) {
        datas.push(
        {
          date : parseInt(lastFrostDate.getTime() / 1000) - weeks[1] * 7 * 86400 + 86400 * obj,
          value : 10  //obj
        });
      });
      var parser = function(data)
      {
        var stats = {

        };
        for (var d in data) {
          stats[data[d].date] = data[d].value;
        }
        return stats;
      };
      var cal = new CalHeatMap();
      cal.init(
      {
        itemSelector : "#" + id,
        start : new Date(2015, 0),
        domain : "month",
        subDomain : "x_day",
        cellSize : 15,
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
