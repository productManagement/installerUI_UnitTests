function  runInitialAsserts(){
    QUnit.test( "Networks Tab Tests I", function( assert ) {



      //Open Networks Tab
      $('#tab-all a[href="#tab-networks"]').tab('show');

       assert.expect( 6 );  

       var actualTitle = $('#tab-networks').text().trim().split('\n')[0];//.getAttribute("lead section-title");
       var expectedTitle='Configure device networks for your site';
       //1. Lead section title == 'Fetch and edit tag Cardss for your devices'
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");
       

        //BACnet/IP ---------------------------------------------------
       //2.
       assert.equal( $('#network-dis').val(),"","Network name is empty");

       //set a value in the network name text box
       $('#network-dis').val('Net18');
       //3. Check that the name is set
       assert.equal( $('#network-dis').val(),"Net18","Network name is Net18");

       //4.
       //3.13.1.   The submit button text shows “Add Network” by default
       assert.equal( $('#networks-add-network').text(),"Add Network","Submit button text == Add Network (Default)");

       //Clear the value from the network name text box
       $('#network-dis').val('');
      //5. Check that the name is empty
       assert.equal( $('#network-dis').val(),"","Network name is empty");

       //Set a Good IP
       var testIp="10.3.3.18";
        $('#network-router').val(testIp)
       //6. Verify Good IP is set
       assert.equal($('#network-router').val(),testIp,"Network IP == "+testIp+" Verified Good IP is set");

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
    QUnit.test( "Networks Tab Tests II", function( assert ) {
        assert.expect( 6 );
        //BACnet/IP ---------------------------------------------------
       //Click to Submit the network record with a good IP and default Name
       $('#networks-add-network').click();

       //Verify network has been added to the "Current Networks" list
       //Do this by entering the name in the Name field and check that the submit button changes to Edit Network

       var networkNamePlaceholder='BACnet 1'
       //Set the value in the network name text box to the definition just added
       $('#network-dis').val(networkNamePlaceholder);

       //1. Check that the name is set
       assert.equal( $('#network-dis').val(),networkNamePlaceholder,"Network name is "+networkNamePlaceholder+" Add Network button was clicked and placeholder value was used as name.");

        //Run the '#network-dis' .keyup function that set the button text
        addNewOrEditNetwork($('#network-dis'));

        //2. Check that the add-network button shows Edit Network
        //3.13.2.  If the Name textbox matches an existing kmcInstallNetwork, the submit button text shows “Edit Network”.
        assert.equal( $('#networks-add-network').text(),"Edit Network","Check button text == Edit Network. \
          The placeholder name was entered into the Name field, exists in the 'Current Networks', triggering the text to change to Edit");



        var actualBorderStyle =  $('#network-router').css("border") //1px solid rgb(204, 204,204) or #CCCCCC or gray
        var expectedErrorBorderStyle = "5px solid rgb(255, 0, 0)"     //5px solid rgb(255, 0, 0) or #FF0000 or red


       assert.notEqual(actualBorderStyle ,expectedErrorBorderStyle, "Router/Subnet textbox style does not indicate error before IP entered.");

        //Set a bad IP to test border highlight
        var testIp="10.2.3.264";
        $('#network-router').val(testIp)
         //3. Verify bad IP is set
        assert.equal($('#network-router').val(),testIp,"Router/Subnet IP == "+testIp+' A bad IP is entered.');
        

        //4. Verify the border is not indicating error
        //3.12.1.1. IP textbox border is set 1px, solid, gray
        assert.notEqual(actualBorderStyle ,expectedErrorBorderStyle, "Router/Subnet textbox style does not indicate error before submit.");
  
       

       var ipTextboxErrorIndication=assert.async();
       //Click to Submit the network record with an IP error
       $('#networks-add-network').click();

        

        var waitForButton=setTimeout(function(){
            //console.log('Add Network clicked');

        actualBorderStyle =  $('#network-router').css("border")
        //6.
        //3.12.2.1. IP textbox border is set 5px, solid, red
              assert.equal(actualBorderStyle ,expectedErrorBorderStyle,"Router/Subnet textbox style indicates error after the Edit Network button is clicked.");
              ipTextboxErrorIndication();
         }, 200);
    

        
       //TODO: BACnet MS/TP -----------------------------------------------

         setTimeout(function() {
          loadNextTab( '../unitTesting/','sitejsDiscoveryTests.js')
         },500);

    });
}



