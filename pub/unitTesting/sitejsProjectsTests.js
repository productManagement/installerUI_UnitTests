//--------KMC Commander Unit Testing--------
//--------Projects Tab Tests--------

var cardInitAsserts=1;

runInitialAsserts();
//formerly "tab-sites"
function  runInitialAsserts(){
    QUnit.test( "Projects Tab Tests I", function( assert ) {
       assert.expect( 8 );
       
       var actualTitle = $('#tab-sites').text().trim().split('\n')[0];
       var expectedTitle='Select and register your Commander BX';
       //1. Lead section title
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");


//#tab-sites > div.row > div > div:nth-child(3) > div.panel-heading
//#tab-sites > div.row > div > div:nth-child(4) > div.panel-heading

        var expectedTitles=["BX Type",
                            "KMC Commander System Login",
                            "Project"]
        for (i = 0; i < 3; i++) {  
               var actualPanelTitle = $('#tab-sites > div.row > div > div:nth-child('+(i+2)+') > div.panel-heading').text();
               var expectedPanelTitle=expectedTitles[i];
               //2. Lead section title
               assert.equal( actualPanelTitle,expectedPanelTitle,"Panel "+ (i+1) +" title == '"+expectedPanelTitle+"'");
       }



  // Delete this temp
  var temp123= new debuggerBreakPoint();

       var expectedTabTitle='KMC Webif Administration Console'
       var actualTabTitle=$('#includedContent > title').text();
       assert.equal( actualTabTitle, expectedTabTitle,"Browser Tab Title == "+expectedTabTitle);


       //1. Verify the Title Bar and link
       //<a class="navbar-brand" href="index.html">Commander BX Install Wizard</a>
       var expectedNavbarHeader='Commander BX Install Wizard';
       var actualNavbarHeader=$('#includedContent > nav > div > a').text();
       assert.equal( actualNavbarHeader,expectedNavbarHeader,"Navbar Header Title == "+expectedNavbarHeader);

       //Assert asynch
       var navbarSi = assert.async();
       var navbarProject= assert.async()
       
        var checkKmcInstallProjectLoadedTimeout;
        var checkKmcInstallProjectLoaded = function (updateIntervalMilliseconds, nSecondsLeft) {
             checkKmcInstallProjectLoadedTimeout=setTimeout(function () {
               if (nSecondsLeft <= 0) {
                    clearTimeout(checkKmcInstallProjectLoadedTimeout);
               }else{ 
                       var expectedNavbarSi='SI Test 1';
                       var actualNavbarSi=$('#navbar-subtitle-si').text();
                    //Pre-Check KmcInstallProject Loaded
                    if (actualNavbarSi!=expectedNavbarSi){
                       checkKmcInstallProjectLoaded(updateIntervalMilliseconds, nSecondsLeft-(updateIntervalMilliseconds/1000));
                    }else{
                    //4. KmcInstallProject is Loaded
                       assert.equal( actualNavbarSi,expectedNavbarSi,"Navbar Systems Integrator == "+expectedNavbarSi+' ('+nSecondsLeft.toFixed(3)+'sec left)');
                       navbarSi();
                    //5. 
                       var expectedNavbarProject='Trinity';
                       var actualNavbarProject=$('#navbar-subtitle-project').text();
                       assert.equal( actualNavbarProject,expectedNavbarProject,"Navbar Project == "+expectedNavbarProject);
                       navbarProject();
                     clearTimeout(checkKmcInstallProjectLoadedTimeout);        

                        // var expectedNavbarCustomer='Test 1';
                        // var actualNavbarCustomer=$('#navbar-subtitle-customer').text();
                        // assert.equal( actualNavbarCustomer,expectedNavbarCustomer,"Navbar Customer == "+expectedNavbarCustomer);
                        // navbarCustomer();
                    }
                  }
             }, updateIntervalMilliseconds);
        };

        checkKmcInstallProjectLoaded(50,1);

       runDataDependentAsserts();
    });
}


function  runDataDependentAsserts(){
    QUnit.test( "Projects Tab Tests II", function( assert ) {
      var initialAssertsExpected=0;
      var delayedAssertsExpected=0;
      assert.expect( initialAssertsExpected + 
                      delayedAssertsExpected );



        //Show Projects Tab
       $('#tab-all a[href="#tab-sites"]').tab('show');
 

      //Verify Fetch Projects button is shown (default)
      //Verify Cloud-Connected is Checked
      //Click Stand-Alone
      //Verify Fetch Projecs button is hidden
      //Click Cloud-Connected 
      //Verify Fetch Projects button is shown

      //10. Click the Fetch Projects button
       setTimeout(function() {
         //var test=$('#sites-fetch-btn').click() verify name
         assert.ok( test, 'x named button clicked' );
       },20);



       //Verify Project is connected
       var actualProject= $('#sites-current').text();
       var expectedProject='Current BX Appliance: Trinity, Floors, Cmdr'

       //Please login to your BX
       var expectedLoginModalTitle='Please login to your BX';
       var actualLoginModalTitle=$('#loginModal').find('h4').text().trim();

       // $('#cloud-host-username').text()
       // $('#cloud-host-password').text()
       // $('#cloud-modal-login').click()

    });


}
      


