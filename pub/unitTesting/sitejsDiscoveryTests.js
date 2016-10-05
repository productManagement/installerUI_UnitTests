//--------KMC Commander Unit Testing--------
//--------Discover Tab Tests--------

var defaultNetworkName='BACnet 1'
var defaultNetworkDiscoveryFile=defaultNetworkName+'.zinc'
var defaultNetworkDiscoveryFileDeviceCount=13;
//Enter the devices from the defaultNetworkDiscoveryFile to use for building the database
//  Model names are added to this list automatically
var devicesToProfile=[{"deviceName":"BAC-9021_000415"}, 
                      {"deviceName":"BAC-9311_0003f0"},
                      {"deviceName":"Room 217"}];

var discoverTableHeaders=[{"nameHeader":"Device Name"}, 
              {"nameHeader":"Device Instance"},
              {"nameHeader":"Model"}];
var discoverTableCountAsserts=1;
var discoverTableAsserts=discoverTableHeaders.length+discoverTableCountAsserts;


function  runInitialAsserts(){
    QUnit.test( "Discovery Tab Tests I", function( assert ) {
       assert.expect( 1 );

       //1
       var discoveryFileCopied = assert.async();
       //copy BACnet1.zinc to the project folder
       var expectedCopyResultText="Copy "+defaultNetworkDiscoveryFile+" error: 0";
       var actualCopyResultText='actualCopyResultText not set by installDefaultDiscoveryFile()';
       installDefaultDiscoveryFile(defaultNetworkDiscoveryFile, function(result){
            actualCopyResultText=result;
            assert.equal( actualCopyResultText,expectedCopyResultText,"Default Discovery file "+defaultNetworkDiscoveryFile +" copy to /db/[project]/io Result == "+expectedCopyResultText);
            discoveryFileCopied();
       });

    });


}

runInitialAsserts();


  //Wait for the Networks Array to load
var networksLoadedTimeout;
var networksLoadedCheck = function (updateIntervalSeconds, nSecondsLeft) {
  networksLoadedTimeout=setTimeout(function () {
       if (nSecondsLeft <= 0) {
            clearTimeout(networksLoadedTimeout);
            runDataDependentAsserts();
          }else{
            if (Networks.length){
              clearTimeout(networksLoadedTimeout);

              runDataDependentAsserts();
            }else{
            networksLoadedCheck(updateIntervalSeconds, nSecondsLeft-updateIntervalSeconds);
          }
          }
  }, updateIntervalSeconds*1000);
};

networksLoadedCheck(1,5);

function  runDataDependentAsserts(){
   //Prerequisites: A discovery file copied from the unitTesting folder
    QUnit.test( "Discover Tab Tests II", function( assert ) {
        assert.expect( discoverTableAsserts + 10 );

       var actualTitle = $('#tab-discover').text().trim().split('\n')[0];//.getAttribute("lead section-title");
       var expectedTitle='Select devices to discover and include from your networks';
       //1.
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");

       var expectedEmptyTableMessage='Showing 0 to 0 of 0 entries'            //No data available in table'
       var actualMessage= $('#discover-table_info').text().trim();
       //2. Discovery table is empty
       assert.equal( actualMessage,expectedEmptyTableMessage,"Discover table empty info == "+expectedEmptyTableMessage);

       //Show Discover Tab
       $('#tab-all a[href="#tab-discover"]').tab('show');
       //3.
       var networksLoaded = assert.async();
        setTimeout(function() {
          assert.ok( Networks.length, "Networks loaded from project database." );
          networksLoaded();
        });

      
       var tableHeader=$('#discover-table-head').find('th');
       var discoverTableTests = new tableTest();

       discoverTableTests.headerSelector=tableHeader;
       discoverTableTests.headerSearchList=discoverTableHeaders;
       var tableHeaderColumnsFound=discoverTableTests.addIndicesToTableHeadersList;

      //4 Test all columns needed were found
       assert.equal(tableHeaderColumnsFound, discoverTableHeaders.length ,"Found indices for "+tableHeaderColumnsFound+" columns.");
      //5 through table headers count
       discoverTableHeaders.forEach( function(columnValue,columnIndex){
           var colNum=discoverTableHeaders[columnIndex].columnIndex;
           var colName=discoverTableHeaders[columnIndex].nameHeader
           assert.notEqual(colNum ,-1,"'"+colName+"' field is column "+colNum);
       });


       var expectedNetworksCheckboxDis=defaultNetworkName;
       var expectedNetworksCheckboxVal=true;
       var actualNetworksCheckbox=checkedNetworks();

       //4. Network Checkboxes - actualNetworksCheckbox is a dictionary of name-value pairs for the checkbox text and checked state
       var result3='User defined Network Checkbox Name== "'+expectedNetworksCheckboxDis+'", checked='+actualNetworksCheckbox[expectedNetworksCheckboxDis];
       assert.equal( actualNetworksCheckbox[expectedNetworksCheckboxDis],expectedNetworksCheckboxVal,result3);

       //Click the Load File button
       $('#Load-discover-File-btn').click();
       //5. Check for file loading message
       var expectedFileLoadingText='Loading network '+defaultNetworkName+' from file...'
       var fileLoading = assert.async();
        setTimeout(function() {
          assert.ok( $('#discover-basicStatus').text()==expectedFileLoadingText, "Message displayed: "+expectedFileLoadingText );
          fileLoading();
        });


       //6. Check for file loaded message
       var expectedFileLoadedText='Loaded network from file.';
       var fileLoaded = assert.async();
       //
       
        setTimeout(function() {
          var actualFileLoadedText= $('#discover-basicStatus').text();
          assert.ok( actualFileLoadedText, "Message displayed: "+expectedFileLoadedText );
          fileLoaded();
        },100);


        var checkTableLoadedTimeout;
        var checkTableLoaded = function (updateIntervalMilliseconds, nSecondsLeft) {
             checkTableLoadedTimeout=setTimeout(function () {
               if (nSecondsLeft <= 0) {
                    clearTimeout(checkTableLoadedTimeout);
               }else{ 
                   var tableLoaded= assert.async();
                   var maxPage=10;
                   var pageTotal=10;
                   var deviceTotal=defaultNetworkDiscoveryFileDeviceCount;
                   if (deviceTotal<=maxPage){pageTotal=deviceTotal};
                   var expectedLoadedTableMessage='Showing 1 to '+pageTotal+' of '+deviceTotal+' entries';
                   var actualLoadedTableMessage= $('#discover-table_info').text().trim();
                    //Pre-Check Table Loaded
                    if (actualLoadedTableMessage!=expectedLoadedTableMessage){
                       checkTableLoaded(updateIntervalMilliseconds, nSecondsLeft-(updateIntervalMilliseconds/1000));
                    }else{
                   //11. Discover table is Loaded
                    assert.equal(actualLoadedTableMessage,expectedLoadedTableMessage,"Discover table loaded info == "+expectedLoadedTableMessage+' ('+nSecondsLeft.toFixed(3)+'sec left)');

                     tableLoaded();
                     clearTimeout(checkTableLoadedTimeout);             
                    }
                  }
             }, updateIntervalMilliseconds);
        };

      checkTableLoaded(100,1);

       var unCheckInclude= assert.async();
      
       //Uncheck All on Discovery table
        setTimeout(function() {
         $('#discover-table-include-all').click();
          unCheckInclude();
        },200);

      //8.
       var appTypeDeviceList=[];
       var loadedDevicesList=[];
       var discoverTableEmpty=assert.async();

      
       setTimeout(function() {
         buildDeviceList(loadedDevicesList,appTypeDeviceList);
        assert.equal(loadedDevicesList.length,0,"Loaded buildDeviceList. No devices in table are selected to include.");
        discoverTableEmpty();
       },200);
       


       var checkDevicesToInclude= assert.async();
      
       //9. and 10. Discovery table is empty
        setTimeout(function() {
          var rowList=$(DiscoverTable.rows()[0])
          var rowsClickedToInclude=0
          rowList.each(function(rowIndex, rowShown){
              //Check for device - rowShown value is the row number as displayed
              //Set Device Name as the header index to locate
              discoverTableTests.columnName= discoverTableHeaders[0].nameHeader;
              var deviceNameCol=discoverTableTests.indexByName
              var tableRowDeviceName=$(DiscoverTable.row(rowShown).nodes()).find('td').eq(deviceNameCol).text();
              devicesToProfile.forEach(function(value,index){
                if (value.deviceName==tableRowDeviceName){
                  //Set the checkbox for the device to profile
                  var deviceToCheck=$(DiscoverTable.row(rowShown).nodes());
                  deviceToCheck.find('input[type="checkbox"]').get()[0].click();
                  rowsClickedToInclude++;
                  //Set Model as the header index to locate
                  discoverTableTests.columnName= discoverTableHeaders[2].nameHeader;
                  var modelColNum=discoverTableTests.indexByName;
                  devicesToProfile[index].model=$(DiscoverTable.row(rowShown).nodes()).find('td').eq(modelColNum).text();
                  discoverTableTests.columnName= discoverTableHeaders[1].nameHeader;
                  var deviceInstacneColNum=discoverTableTests.indexByName;
                  devicesToProfile[index].deviceInstance=$(DiscoverTable.row(rowShown).nodes()).find('td').eq(deviceInstacneColNum).text();
                }
              });
          });

          assert.equal(rowsClickedToInclude, devicesToProfile.length, devicesToProfile.length+" devices were clicked to include.");
          checkDevicesToInclude();
        },500);

      //11
      var discoverTableNotEmpty=assert.async();
       //selectedDeviceList[0].objectName

       setTimeout(function() {
        buildDeviceList(loadedDevicesList,appTypeDeviceList);
        assert.equal(appTypeDeviceList.length, devicesToProfile.length, "Loaded buildDeviceList. "+ devicesToProfile.length+" devices in table selected .");
        //assert.equal(profiledDeviceList.length, devicesToProfile.length, devicesToProfile.length+" devices in table selected .");
        discoverTableNotEmpty();
        loadNextTab( '../unitTesting/','sitejsProfilesTests.js')
       },500); 


        //4.9.  Clicking the Discover button clears the Devices table 
   //Live discover
   //Delete io/kmcDiscovery.zinc
   // Delete io/BACnet1.zinc
       var expectedDiscoveringNetworkText='Discovering network '+defaultNetworkName+'. Job running.'
   //verify kmcDiscovery.zinc was created
   //Verify defaultNetworkDiscoveryFile was created

    });
}
      





