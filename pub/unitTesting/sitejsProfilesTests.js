//--------KMC Commander Unit Testing--------
//--------Profiles Tab Tests--------
var deviceNameToCustomProfile='Room 217';
var profileTableHeaders=[{"nameHeader":"Device Name"}, 
              {"nameHeader":"Device Instance"},
              {"nameHeader":"Model"},
              {"nameHeader":"Profile"}];
var profileTableCountAsserts=1;
var profileTableAsserts=profileTableHeaders.length + profileTableCountAsserts;




function  runInitialAsserts(){
    QUnit.test( "Profiles Tab Tests I", function( assert ) {
       assert.expect( 1 );

       var actualTitle = $('#tab-profiles').text().trim().split('\n')[0];//.getAttribute("lead section-title");
       var expectedTitle='Fetch and edit tag profiles for your devices';
       //1. Lead section title == 'Fetch and edit tag profiles for your devices'
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");


       runDataDependentAsserts();
    });
}

runInitialAsserts();

function  runDataDependentAsserts(){
   //Prerequisites: A discovery file copied from the unitTesting folder
    QUnit.test( "Profiles Tab Tests II", function( assert ) {
      
      var initialAssertsExpected=3;
      var delayedAssertsExpected=4;
      assert.expect( initialAssertsExpected + 
                      profileTableAsserts +
                      delayedAssertsExpected );


        //Show Profile Tab
       $('#tab-all a[href="#tab-profiles"]').tab('show');
 
       var expectedEmptyTableMessage='Showing 0 to 0 of 0 entries'            //No data available in table'
       var actualMessage= $('#profiles-table_info').text().trim();
       //2. Profiles table empty info == Showing 0 to 0 of 0 entries
       assert.equal( actualMessage,expectedEmptyTableMessage,"Profiles table empty info == "+expectedEmptyTableMessage);

       //Check Pre-loaded table properties
       var tableHeader=$('#profiles-table-head').find('th');
       var profileTableTests = new tableTest();

       profileTableTests.headerSelector=tableHeader;
       profileTableTests.headerSearchList=profileTableHeaders;
       var tableHeaderColumnsFound=profileTableTests.addIndicesToTableHeadersList;//getColumnLocationsByHeader(tableHeader,profileTableHeaders)

      //3 Test all columns needed were found "Found indices for 4 columns.""
       assert.equal(tableHeaderColumnsFound, profileTableHeaders.length ,"Found indices for "+tableHeaderColumnsFound+" columns.");

      //4-7 profileTableHeaders.count
       profileTableHeaders.forEach( function(columnValue,columnIndex){
           var colNum=profileTableHeaders[columnIndex].columnIndex;
           var colName=profileTableHeaders[columnIndex].nameHeader
           assert.notEqual(colNum ,-1,"'"+colName+"' field is column "+colNum);
       });

      //8. Verify Knowledge Base Connecting status
        var expectedKBConnectingMessage='Connecting to profile knowledge base...';
        var actualKBConnectingMessage=$('#profiles-basicStatus').text().trim();
        var resultKBConnecting="Profile KB Status message == '"+expectedKBConnectingMessage+"'"
         assert.equal( actualKBConnectingMessage,expectedKBConnectingMessage,resultKBConnecting);
      
      //9. Verify Empty Cloud Status Message
        var expectedCloudStatusMessage='';
        var actualCloudStatusMessage=$('#profiles-cloudStatus').text().trim();
        var resultCloudStatus="Cloud Status message initial == '"+expectedCloudStatusMessage+"'"
         assert.equal( actualCloudStatusMessage,expectedCloudStatusMessage,resultCloudStatus);

      //10. Click the Match Prfofiles button
       setTimeout(function() {
         var test=$('#profiles-fetch-btn').click();
         assert.ok( test, 'Match Profiles button clicked' );
       },20);


       //Delayed Asserts
       //Assert asynch
       var kbConnected = assert.async();
       var cloudConnected = assert.async();
       var tableLoaded= assert.async()

       //11. Verify Knowledge Base Connected status
        setTimeout(function() {
          var expectedKBConnectedMessage='Connected to profile knowledge base';
          var actualKBConnectedMessage=$('#profiles-basicStatus').text().trim();
          var resultKBMessageTest="Profile KB Status message == '"+expectedKBConnectedMessage+"'"
          assert.equal( actualKBConnectedMessage,expectedKBConnectedMessage,resultKBMessageTest);
          kbConnected();


         //12. Verify No Cloud Message (good connection)  //100ms is not enough time to check the cloud connection 200ms worked
          var noCloudConnectionMessage='Must be logged into cloud'; 
          //var expectedCloudStatusMessage='';
           actualCloudStatusMessage=$('#profiles-cloudStatus').text().trim();
           resultCloudStatus="Cloud Status message final == '"+expectedCloudStatusMessage+"'"
           assert.equal( actualCloudStatusMessage,expectedCloudStatusMessage,resultCloudStatus);
          cloudConnected();


        var checkTableLoadedTimeout;
        var checkTableLoaded = function (updateIntervalMilliseconds, nSecondsLeft) {
             checkTableLoadedTimeout=setTimeout(function () {
               if (nSecondsLeft <= 0) {
                    clearTimeout(checkTableLoadedTimeout);
               }else{ 
                    var maxPage=10;
                    var pageTotal=10;
                    var deviceTotal=devicesToProfile.length;
                    if (deviceTotal<=maxPage){pageTotal=deviceTotal};
                    var expectedLoadedTableMessage='Showing 1 to '+pageTotal+' of '+deviceTotal+' entries';
                    var actualLoadedTableMessage= $('#profiles-table_info').text().trim();
                    //Pre-Check Table Loaded
                    if (actualLoadedTableMessage!=expectedLoadedTableMessage){
                       checkTableLoaded(updateIntervalMilliseconds, nSecondsLeft-(updateIntervalMilliseconds/1000));
                    }else{
                    // Delete this temp
                    var temp123= new debuggerBreakPoint();
                    //13. Profile table is Loaded
                     assert.equal(actualLoadedTableMessage,expectedLoadedTableMessage,"Profiles table loaded info == "+expectedLoadedTableMessage+' ('+nSecondsLeft.toFixed(3)+'sec left)');
                     tableLoaded();
                     clearTimeout(checkTableLoadedTimeout);             
                    }
                  }
             }, updateIntervalMilliseconds);
        };

        checkTableLoaded(100,1);

        },200);
        //end Delayed Asserts

    });

    runCustomProfileAsserts();


}
      



function runCustomProfileAsserts(){
   QUnit.test( "Profiles Tab Custom Profile Tests", function( assert ) {
    var customProfileAssertCount=4;
    assert.expect(customProfileAssertCount)
       
    //Device to Custom profile

       //1. Build the custom Profile Button selector based on the deviceNameToCustomProfile
      var deviceInstanceToCustomProfile=-1;
      var deviceModelToCustomProfile='';
      devicesToProfile.forEach(function(deviceDict,i){
           if (deviceDict.deviceName==deviceNameToCustomProfile){ 
            deviceInstanceToCustomProfile=deviceDict.deviceInstance;
            deviceModelToCustomProfile=deviceDict.model;
          }
      });
      assert.ok( deviceInstanceToCustomProfile!=-1, 'Build the custom Profile Button selector based on the deviceNameToCustomProfile '+deviceNameToCustomProfile );

     //2. Click the custom Profile Button
       var test=$('#btn-customprofile-device'+deviceInstanceToCustomProfile).click();
       assert.ok( test, 'Create Profile button clicked using Device Instance '+deviceInstanceToCustomProfile );

       //Delayed Asserts
       //Assert asynch
       var customProfileModalHeading = assert.async();
       var customProfileModalPanelHeading1 = assert.async();

    setTimeout(function() {
       //3. Lead section title == 'Fetch and edit tag profiles for your devices'
      var expectedCustomProfileModalTitle='Create a custom profile';
      var actualCustomProfileModalTitle=$('#customProfileModal').find('h4').text().trim();
      var resultMessage="Create Custom Profile Modal heading == '"+expectedCustomProfileModalTitle+"'"
      assert.equal( actualCustomProfileModalTitle,expectedCustomProfileModalTitle,resultMessage);
      customProfileModalHeading();

     //4. The Device panel Heading is set to the model of the device clicked 
      var actualCustomProfileDeviceHeading = $('#customProfile-deviceHeading').text().trim();
      var expectedCustomProfileDeviceHeading='Device ('+deviceModelToCustomProfile+')';
      resultMessage="Device Panel Heading == '"+expectedCustomProfileDeviceHeading+"'"
      assert.equal( actualCustomProfileDeviceHeading,expectedCustomProfileDeviceHeading,resultMessage);
      customProfileModalPanelHeading1();


    },50); //Click a Create Profile button wait complete






     setTimeout(function() {
      loadNextTab( '../unitTesting/','sitejsCardsTests.js')
     },500);
   });
}


