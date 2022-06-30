# COVID19

Este es el respositorio de mi proyecto de mi aplicación que muestra el estado de contagios en México de covid en todos los municipios del país.
El archivo MapaDatosCOVID19.php es quien consulta datos oficiales cargados a base de datos local y genera los datos necesarios que consume la aplicación
para pintar, tabular y mostrar en el mapa. Donde todo el archivo html generado dinámicamente, es guardado en un html estático para consultas posteriores más rápidas y
va renombrando los htmls generados con anterioridad con la fecha de su actualización oficial correspondiente. Esta lista se guarda en un csv para que mapas 
de fechas anteriores tengan acceso a toda la lista de archivos html existentes y permita su navegación con las más recientes. Los mapas son presentados con
la librería de openlayers.
Base de datos local consultada: PostgreSQL v14
PHP v8.1
De terceros:
Librerías javascript:
	d3.js
	ol.js
Estilos:
	ol.js
	fontawesome
