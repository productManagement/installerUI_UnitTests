//--------KMC Commander Unit Testing--------
//--------Build Tab Tests--------

var cardInitAsserts=1;

runInitialAsserts();

function  runInitialAsserts(){
    QUnit.test( "Build Tab Tests I", function( assert ) {
       assert.expect( 3 );
       //1.
       //var discoveryFileCopied = assert.async();
       //copy BACnet1.zinc to the project folder
       var projectUsage=0
       var licenseTotal=5
       var expectedCapsIndicatorText='CAPS used: ' +projectUsage+ ' of '+licenseTotal;
       var actualCapsIndicatorText=$('#navbar-subtitle-caps').text();
       assert.equal( actualCapsIndicatorText,expectedCapsIndicatorText,"Build Tab "+expectedCapsIndicatorText);
       
       //2.
       //Verfiy Caps Indicator displays temp license  
       var expectedCapsIndicatorFontStyle='italic'; 
       var actualCapsIndicatorFontStyle =  $('#navbar-subtitle-caps').css("font-style")
       assert.equal( actualCapsIndicatorFontStyle,expectedCapsIndicatorFontStyle,"Caps Indicator font Style "+expectedCapsIndicatorFontStyle);

       //2.
       //Verfiy Caps Indicator Color  
       var expectedCapsIndicatorColor='rgb(0, 0, 255)'; 
       var actualCapsIndicatorColor =  $('#navbar-subtitle-caps').css("color")
       assert.equal( actualCapsIndicatorColor,expectedCapsIndicatorColor,"Caps Indicator color "+expectedCapsIndicatorColor);

       runDataDependentAsserts();
    });
}


function  runDataDependentAsserts(){
   //Prerequisites: A discovery file copied from the unitTesting folder
    QUnit.test( "Build Tab Tests II", function( assert ) {
      var initialAssertsExpected=4;
      var delayedAssertsExpected=0;
      assert.expect( initialAssertsExpected + 
                      delayedAssertsExpected );

       var actualTitle = $('#tab-build').text().trim().split('\n')[0];
       var expectedTitle='Build your project';
       //1. Lead section title
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");

        //Show Build Tab
       $('#tab-all a[href="#tab-build"]').tab('show');
 

      //10. Click the Build Project button
       setTimeout(function() {
         //var test=$('#build-submit').click()
         assert.ok( test, 'Build Project button clicked' );
       },20);


// During the build we need to wait until the text message says:
// Creating device BAC-9311_0003f0 (1 of 3)
// Creating device BAC-9021_000415 (2 of 3)
// Creating device Room 217 (3 of 3)
// Done
      // var creatingDevice=[];
      // creatingDevice[0]=assert.async();
      // creatingDevice[1]=assert.async();
      // creatingDevice[2]=assert.async();
      //   var deviceBeingBuilt=0;
      //   var checkCreateDeviceTimeout;
      //   var checkCreateDevice = function (updateIntervalMilliseconds, nSecondsLeft) {
      //        checkCreateDeviceTimeout=setTimeout(function () {
      //          if (nSecondsLeft <= 0) {
      //               clearTimeout(checkCreateDeviceTimeout);
      //          }else{ 
      //               var maxPage=10;
      //               var pageTotal=10;
      //               var deviceTotal=devicesToProfile.length;
      //               if (deviceTotal<=maxPage){pageTotal=deviceTotal};
      //               var expectedLoadedTableMessage='Showing 1 to '+pageTotal+' of '+deviceTotal+' entries';
      //               var actualStatusMessage= $('#build-basicStatus').text().trim();
      //               //Pre-Check Table Loaded
      //               if (actualLoadedTableMessage!=expectedLoadedTableMessage){
      //                  checkCreateDevice(updateIntervalMilliseconds, nSecondsLeft-(updateIntervalMilliseconds/1000));
      //               }else{
      //               // Delete this temp
      //               var temp123= new debuggerBreakPoint();
      //               //13. Profile table is Loaded
      //                assert.equal(actualLoadedTableMessage,expectedLoadedTableMessage,"Profiles table loaded info == "+expectedLoadedTableMessage+' ('+nSecondsLeft.toFixed(3)+'sec left)');
      //                //end the test for this device
      //                creatingDevice[deviceBeingBuilt]();
      //                clearTimeout(checkCreateDeviceTimeout);             
      //               }
      //             }
      //        }, updateIntervalMilliseconds);
      //   };

      //   checkCreateDevice(100,1);



       //3. Verify Cap usage - Still temp
       var projectUsage=23
       var licenseTotal=5
       // var expectedCapsIndicatorText='CAPS used: ' +projectUsage+ ' of '+licenseTotal;
       // var actualCapsIndicatorText=$('#navbar-subtitle-caps').text();
       // assert.equal( actualCapsIndicatorText,expectedCapsIndicatorText,"Build Tab "+expectedCapsIndicatorText);
       
       //2.
       //Verfiy Caps Indicator displays temp license  
       var expectedCapsIndicatorFontStyle='italic'; 
       var actualCapsIndicatorFontStyle =  $('#navbar-subtitle-caps').css("font-style")
       assert.equal( actualCapsIndicatorFontStyle,expectedCapsIndicatorFontStyle,"Caps Indicator font Style "+expectedCapsIndicatorFontStyle);

       //3. Verfiy Caps Indicator Color  
       var expectedCapsIndicatorColor='rgb(0, 0, 255)'; 
       var actualCapsIndicatorColor =  $('#navbar-subtitle-caps').css("color")
       assert.equal( actualCapsIndicatorColor,expectedCapsIndicatorColor,"Caps Indicator color "+expectedCapsIndicatorColor);


       //Verify Activate New License button is hidden
       var actualDisplayStyle=$('#finalize-uploadLicense-set').css('style')
       var expectedDisplayStyle='display:none';

       //Check message before Fetch License from Cloud button
       var cloudLicenseCaps=5000;
       var actualLicenseStatusText=$('#build-licenseCaps').text();
       
       var expecedLicenseStatusText='';
      // assert.equal( actualLicenseStatusText,expectedLicenseStatusText,"Caps on cloud license == "+expectedLicenseStatusText);
       //Click the Fetch License from Cloud Button
       var caps=projectUsage;
       expectedLicenseStatusText='License has '+caps+' caps'
       actualLicenseStatusText=$('#build-licenseCaps').text();
       assert.equal( actualLicenseStatusText,expectedLicenseStatusText,"Caps on cloud license == "+expectedLicenseStatusText);

        
       //Click Activate New Licence

       //Click Update Site for License
       //Wait for restart
       
       //Verify message 
       //actual $('#build-basicStatus').text().trim();
       //expected "Service is ready. Full license is active."
       
       //Verify Caps use Permanent license
       //Font regular


  // Delete this temp
  var temp123= new debuggerBreakPoint();
       //Please login to your BX
       var expectedLoginModalTitle='Please login to your BX';
       var actualLoginModalTitle=$('#loginModal').find('h4').text().trim();

       // $('#cloud-host-username').text()
       // $('#cloud-host-password').text()
       // $('#cloud-modal-login').click()

    });


}
      


