/**
 * Autor: Francisco Angel Ramírez Lopez
 */

var path = window.location.pathname;
var page = path.split("/").pop();
console.log( page );

/**
	Ejecutando listado de mapas disponibles e insertándo estos como opcioens en el select de fechas

 */
d3.csv("./fechas.csv").then(function(data) {
	const selectfecha = document.getElementById("fechaid");
	let opcion = document.createElement('option');
	opcion.value = "#";
	opcion.innerHTML = "Selecciona fecha..." ;
	selectfecha.appendChild(opcion);
    for (var i = 0; i < data.length; i++) {
		opcion = document.createElement('option');
		opcion.value = data[i].fecha;
		if(data[i].fecha === "index"){
			opcion.innerHTML = "Actual";
		} else {			
			opcion.innerHTML = data[i].fecha;
		}
		if(data[i].fecha + ".html" === page)
			opcion.selected = true;
    	selectfecha.appendChild(opcion);
    }
});