var topologies='';
var topologies2='';

var jqxhr = $.getJSON( "json/siteTopologies.json", function() {
  console.log( "siteTopologies.json read" );
})
  .done(function() {
      topologies=jqxhr.responseJSON.topologies;
      topologies2=jqxhr.responseJSON.topologies2;  
  })
  .fail(function() {
    console.log( "error reading siteTopologies.json" );
  })
 
jqxhr.complete(function() {
  console.log( "success loading all topologies from file." );
});