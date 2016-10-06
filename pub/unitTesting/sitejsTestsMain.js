function loadNextTab(filepath, filename){
      $.getScript( filepath+filename, function( data, textStatus, jqxhr ) {
      console.log( "Loaded "+filename +'.  Returned:'+ data ); // Data returned
      console.log( textStatus ); // Success
      console.log( jqxhr.status ); // 200
    });

}

function installDefaultDiscoveryFile(filename, result){
    $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=/apps/kmc-commander-bx.sideload/current/opt/finstack/pub/unitTesting/discoveryFiles.sh '+'"'+filename+'"',
        headers: {
          Accept: 'text/plain',
          "Content-Type": "text/plain; charset=utf-8"
    },
    success: function(data){
       result(data.stdout.split('\n')[0]);
       },
    error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }  
    });
}



class tableTest{
  constructor(){
    this.selector;
    this.list;
    this.name;
  };

  get addIndicesToTableHeadersList(){
          return this.getColumnLocationsByHeader(this.selector,this.list)
  }
  
  get indexByName(){
          return this.getColumnIndexByName(this.name)
  }

   set headerSelector(value) {
     this.selector = value;
    }

   set headerSearchList(value) {
     this.list = value;
    }

   set columnName(value) {
     this.name = value;
    }

   //Add the column index to a given list of column name dictionaries 
   getColumnLocationsByHeader(selector,list){
       var columnsFound=0;
       selector.each( function( index, value )  {
            list.forEach( function(columnValue,columnIndex){
                  if (value.innerText.trim()==columnValue.nameHeader) {
                    list[columnIndex].columnIndex = index;
                    columnsFound++;
                  };
            });
       });
       return columnsFound;
   };

   getColumnIndexByName(name){
      for (var i in this.list) {
          if (this.list[i].nameHeader==name){
            return this.list[i].columnIndex;
          };
      };
   };
};


class debuggerBreakPoint{
  constructor(){
    this.isMyBreakpoint;
  };
};
