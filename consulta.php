<?php 


/**
 * Función que conecta a la base de datos de SNIC
 * @return [type] [description]
 */
function conectaCOVID19() {
	$sctx = "host=localhost port=5432 dbname=COVID19 user=postgres password=pgadmin"; // local
	// $sctx = "host=172.17.8.201 port=5432 dbname=COVID19 user=postgres"; // remoto SC
	$ctx = pg_connect($sctx) or die('No se ha podido conectar: ' . pg_last_error());
	return $ctx;
}




function obtenFechaActyAnt() {
	$conexion = conectaCOVID19();
	global $fechaactual;

	$query0 = "SELECT DISTINCT fecha_actualizacion AS f_act FROM covid19 ORDER BY fecha_actualizacion DESC;";
	$res0 = pg_query($conexion, $query0) or die('La consulta 0 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res0, NULL, PGSQL_ASSOC)) {
		$afech[$i++] = $fila['f_act'];
	}	
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res0);		
	// Cerrando la conexión
	pg_close($conexion);

	return [$afech[0], $afech[1]];
}

$ar = obtenFechaActyAnt();

echo $ar[0] . '<br>';
echo $ar[1];

 ?>