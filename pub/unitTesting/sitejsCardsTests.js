//--------KMC Commander Unit Testing--------
//--------Cards Tab Tests--------

var cardInitAsserts=1;

runInitialAsserts();

function  runInitialAsserts(){
    QUnit.test( "Cards Tab Tests I", function( assert ) {
       assert.expect( 1 );
       var actualTitle = $('#tab-cards').text().trim().split('\n')[0];//.getAttribute("lead section-title");
       var expectedTitle='Choose Cards for your devices';
       //1. Lead section title == 'Fetch and edit tag Cards for your devices'
       assert.equal( actualTitle,expectedTitle,"Lead section title == '"+expectedTitle+"'");

       runDataDependentAsserts();
    });
}


function  runDataDependentAsserts(){
   //Prerequisites: A discovery file copied from the unitTesting folder
    QUnit.test( "Cards Tab Tests II", function( assert ) {
      var initialAssertsExpected=3;
      var delayedAssertsExpected=0;
      assert.expect( initialAssertsExpected + 
                      delayedAssertsExpected );



        //Show Cards Tab
       $('#tab-all a[href="#tab-cards"]').tab('show');
 
      //Click the Load Cards button
      $('#cards-load').click()

       var appTypeDeviceList=[];
       var loadedDevicesList=[];
       buildDeviceList(loadedDevicesList,appTypeDeviceList);

      // Delete this temp
      var temp123= new debuggerBreakPoint();


      //Click the 'Add Card' buttons
      //Add Card button construction: id="cardsAddBtn-'+d.deviceObject.objectId'
      var clickAddCard=[];
      clickAddCard[0]=assert.async();
      clickAddCard[1]=assert.async();
      clickAddCard[2]=assert.async();

      setTimeout(function() {
        for (i = 0; i < 3; i++) {  
            var test=$('#cardsAddBtn-'+loadedDevicesList[i].objectId).click();
            assert.ok( test, "Clicked 'Add Card' button for "+loadedDevicesList[i].objectName );
            clickAddCard[i]();
        }       
        
      },100);

    });



     setTimeout(function() {
      loadNextTab( '../unitTesting/','sitejsBuildTests.js')
     },500);

}
      


