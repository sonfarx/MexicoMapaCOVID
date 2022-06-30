<?php

$arangos = [];
$arangoscol = [];
setlocale(LC_ALL,"es_MX");
$ar = obtenFechaActyAnt();
$fechaactual = $ar[0];
$fechaanterior = $ar[1];
// $arangoscol = [sprintf("#%02x%02x%02x", 250, 255, 206), sprintf("#%02x%02x%02x", 255, 222, 58), sprintf("#%02x%02x%02x", 254, 113, 18), sprintf("#%02x%02x%02x", 250, 44, 43)];

// $arangoscol = ['#E9ABED','#F263F0','#FB19F4','#490095']; // gama purpura
$arangoscol = ['#FCFFA5','#FFC343','#F07700','#F60000']; // gama arcoiris


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


function obtenDatosTotalesAyer() {
	$conexion = conectaCOVID19();
	global $fechaanterior;	

	$query1= "SELECT fecha_actualizacion AS f_act, entidad_res AS estado_id, COUNT(clasificacion_final) AS positivo, COUNT(fecha_def) AS defuncion 
				FROM covid19 
				WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaanterior' GROUP BY entidad_res, fecha_actualizacion ORDER BY entidad_res ASC;";
	$res1 = pg_query($conexion, $query1) or die('La consulta 1 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res1, NULL, PGSQL_ASSOC)) {
		$apos[$i] = $fila['positivo'];
		$adef[$i] = $fila['defuncion'];
		$i++;
	}
	pg_result_seek($res1, 0);
	
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res1);	

	// Cerrando la conexión
	pg_close($conexion);

	$totposayer = array_sum($apos);
	$totdefayer = array_sum($adef);
	return [$totposayer, $totdefayer];
}


function obtenDatosTotales() {

	$conexion = conectaCOVID19();
	global $fechaactual;
	global $fechaanterior;

	$query1 = "SELECT t1.estado_id, t1.positivo, t1.defuncion, t2.pobedo FROM 
(SELECT entidad_res AS estado_id, COUNT(clasificacion_final) AS positivo, COUNT(fecha_def) AS defuncion FROM covid19 
				WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual' GROUP BY entidad_res, fecha_actualizacion ORDER BY entidad_res ASC) AS t1, 
(SELECT estado_id, SUM(ptot) AS pobedo FROM municipios GROUP BY estado_id ORDER BY estado_id ASC) AS t2
				WHERE t1.estado_id=t2.estado_id ORDER BY t1.estado_id ASC;";
	$res1 = pg_query($conexion, $query1) or die('La consulta 1 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res1, NULL, PGSQL_ASSOC)) {
		$apos[$i] = $fila['positivo'];
		$adef[$i] = $fila['defuncion'];
		$apobedo[$i] = $fila['pobedo'];
		$i++;
	}
	pg_result_seek($res1, 0);

	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res1);


	$query2 = "SELECT fecha_actualizacion, entidad_res AS estado_id, COUNT(clasificacion_final) AS sospechoso FROM covid19 WHERE clasificacion_final=6 AND fecha_actualizacion='$fechaactual' GROUP BY fecha_actualizacion, entidad_res ORDER BY fecha_actualizacion, entidad_res ASC;";
	$res2 = pg_query($conexion, $query2) or die('La consulta 2 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res2, NULL, PGSQL_ASSOC)) {

		$asos[$i++] = $fila['sospechoso'];
	}
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res2);


	$query3= "SELECT fecha_actualizacion, entidad_res AS estado_id, COUNT(clasificacion_final) AS positivosx, sexo FROM covid19 WHERE clasificacion_final<=3 AND sexo=1 AND fecha_actualizacion='$fechaactual' GROUP BY fecha_actualizacion, entidad_res, sexo ORDER BY fecha_actualizacion, entidad_res ASC;";
	$res3 = pg_query($conexion, $query3) or die('La consulta 3 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res3, NULL, PGSQL_ASSOC)) {

		$amujer[$i++] = $fila['positivosx'];
	}
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res3);


	$query4 = "SELECT fecha_actualizacion, entidad_res AS estado_id, COUNT(clasificacion_final) AS positivosx, sexo FROM covid19 WHERE clasificacion_final<=3 AND sexo=2 AND fecha_actualizacion='$fechaactual' GROUP BY fecha_actualizacion, entidad_res, sexo ORDER BY fecha_actualizacion, entidad_res ASC;";
	$res4 = pg_query($conexion, $query4) or die('La consulta 4 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res4, NULL, PGSQL_ASSOC)) {

		$ahom[$i++] = $fila['positivosx'];
	}
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res4);



	$query5 = "SELECT t1.estado_id,  t1.actv_vivo, t2.actv_def, ( t1.actv_vivo -  t3.actv_vivoant) AS nvos_actvviv, 
			(t2.actv_def -  t4.actv_defant) AS nvos_actvdef,
	CASE WHEN (t5.pos - t6.pos) IS NOT NULL THEN (t5.pos - t6.pos) ELSE 0 END AS nvospos, 
	CASE WHEN (t7.def - t8.def) IS NOT NULL THEN (t7.def - t8.def) ELSE 0 END AS nvosdef
				FROM 
					(SELECT entidad_res AS estado_id, COUNT(fecha_sintomas) AS actv_vivo FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_def IS NULL 
					AND fecha_sintomas > DATE(CAST('$fechaactual' AS DATE) - CAST('14 days' AS INTERVAL)) 
					AND fecha_actualizacion='$fechaactual' GROUP BY entidad_res ORDER BY estado_id) AS t1
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(fecha_def) AS actv_def FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_def IS NOT NULL 
					AND fecha_sintomas > DATE(CAST('$fechaactual' AS DATE) - CAST('14 days' AS INTERVAL)) 
					AND fecha_actualizacion='$fechaactual' GROUP BY entidad_res ORDER BY estado_id) AS t2 
				ON t1.estado_id = t2.estado_id 
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(fecha_sintomas) AS actv_vivoant FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_def IS NULL 
					AND fecha_sintomas > DATE(CAST('$fechaanterior' AS DATE) - CAST('14 days' AS INTERVAL)) 
					AND fecha_actualizacion='$fechaanterior' GROUP BY entidad_res ORDER BY estado_id) AS t3
				ON t1.estado_id = t3.estado_id	
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(fecha_def) AS actv_defant FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_def IS NOT NULL 
					AND fecha_sintomas > DATE(CAST('$fechaanterior' AS DATE) - CAST('14 days' AS INTERVAL)) 
					AND fecha_actualizacion='$fechaanterior' GROUP BY entidad_res ORDER BY estado_id) AS t4
				ON t1.estado_id = t4.estado_id 
				
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(clasificacion_final) AS pos FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual'
					GROUP BY entidad_res ORDER BY estado_id) AS t5
				ON t1.estado_id = t5.estado_id 				
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(clasificacion_final) AS pos FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaanterior'
					GROUP BY entidad_res ORDER BY estado_id) AS t6
				ON t1.estado_id = t6.estado_id 	
				
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(fecha_def) AS def FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual' AND fecha_def IS NOT NULL
					GROUP BY entidad_res ORDER BY estado_id) AS t7
				ON t1.estado_id = t7.estado_id 				
				LEFT JOIN 
					(SELECT entidad_res AS estado_id, COUNT(fecha_def) AS def FROM covid19 
					WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaanterior' AND fecha_def IS NOT NULL 
					GROUP BY entidad_res ORDER BY estado_id) AS t8
				ON t1.estado_id = t8.estado_id 			
													
	 ORDER BY t1.estado_id;";

	$res5 = pg_query($conexion, $query5) or die('La consulta 5 fallo: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res5, NULL, PGSQL_ASSOC)) {

		$aactv_viv[$i] = $fila['actv_vivo'] != NULL ? $fila['actv_vivo'] : 0;
		$aactv_def[$i] = $fila['actv_def'] != NULL ? $fila['actv_def'] : 0;
		$anvoactv_viv[$i] = $fila['nvos_actvviv'] != NULL ? $fila['nvos_actvviv'] : 0;
		$anvoactv_def[$i] = $fila['nvos_actvdef'] != NULL ? $fila['nvos_actvdef'] : 0;
		$anvospos[$i] = $fila['nvospos'] != NULL ? $fila['nvospos'] : 0;
		$anvosdef[$i] = $fila['nvosdef'] != NULL ? $fila['nvosdef'] : 0;
		$i++;
	}
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res5);

#FAFFCE

	// Cerrando la conexión
	pg_close($conexion);

	return [$apobedo, $apos, $adef, $asos, $amujer, $ahom, $fechaactual, $aactv_viv, $aactv_def, $anvoactv_viv, $anvoactv_def, $anvospos, $anvosdef, $fechaanterior];

}

function claveCompleta($eid, $mid) {
  $seid = $eid;
  $smid = $mid;
  if($eid < 10 )
    $seid = "0".$seid;
  if($mid < 100){
    if($mid < 10)
      $smid = "00".$smid;
    else
      $smid = "0".$smid;
  }
  return $seid.$smid;
}


/**
 * Función encargada de obtener la estructura del mapa coroplético en formato json, apartir de un arreglo generado por el query a la base de datos
 * @return json Devuelve la estructura json
 */
function obtenMCoroJson() {

	global $arangos;
	global $arangoscol;
	global $fechaactual;
	global $fechaanterior;

	$conexion = conectaCOVID19();
	$eid = 0;
	// if($eid == '' || $eid == 0) {

	// 	$query= "SELECT municipio_res AS municipio_id, entidad_res AS estado_id, COUNT(*) AS positivos FROM covid19 WHERE clasificacion_final<=3 GROUP BY municipio_res, entidad_res ORDER BY municipio_res ASC;";
	// 	$alcance = 'Nacional';
	// } else {

	// 	$query= "SELECT municipio_res AS municipio_id, COUNT(*) AS positivo FROM covid19 WHERE clasificacion_final<=3 AND entidad_res=$eid GROUP BY municipio_res ORDER BY municipio_res ASC;";
	// 	$alcance = 'Estatal';
	// }
	

	$alcance = "Nacional";

///////////////////////////////////////////////////////// QUERY 1 /////////////////////////////////////////////////////////////
// 	$query = "SELECT t1.edo_id, t1.mun_id, t1.positivo, t2.ptotmun FROM 
// (SELECT entidad_res AS edo_id, municipio_res AS mun_id, COUNT(*) AS positivo FROM covid19 
// 		WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual' GROUP BY fecha_actualizacion, municipio_res, entidad_res ORDER BY entidad_res, municipio_res ASC) AS t1,
// (SELECT estado_id AS edo_id, municipio_id AS mun_id, SUM(ptot) AS ptotmun FROM municipios GROUP BY municipio_id, estado_id ORDER BY estado_id, municipio_id ASC) AS t2
// WHERE t1.edo_id=t2.edo_id AND t1.mun_id=t2.mun_id ORDER BY t1.edo_id, t1.mun_id ASC;";


	$query = "SELECT t1.edo_id, t1.mun_id, t1.activo_viv, t2.ptotmun FROM 
(SELECT entidad_res AS edo_id, municipio_res AS mun_id, COUNT(fecha_sintomas) AS activo_viv 
			FROM covid19 
			WHERE clasificacion_final<=3 
			AND fecha_sintomas > DATE(CAST('$fechaactual' AS DATE) - CAST('14 days' AS INTERVAL)) AND fecha_actualizacion='$fechaactual'
			GROUP BY municipio_res, entidad_res ORDER BY entidad_res, municipio_res) AS t1,
(SELECT estado_id AS edo_id, municipio_id AS mun_id, SUM(ptot) AS ptotmun FROM municipios GROUP BY municipio_id, estado_id ORDER BY estado_id, municipio_id ASC) AS t2
WHERE t1.edo_id=t2.edo_id AND t1.mun_id=t2.mun_id ORDER BY t1.edo_id, t1.mun_id ASC;";

	$res1 = pg_query($conexion, $query) or die('La consulta 1 falló: ' . pg_last_error());

	$i=0;
	while ($fila = pg_fetch_array($res1, NULL, PGSQL_ASSOC)) {

		$aentmunpos[$i] = $fila['activo_viv'];
		$acvecompleta[$i] = claveCompleta($fila['edo_id'], $fila['mun_id']);
		$aentmunptot[$i] = $fila['ptotmun'];

		$i++;
	}	

	pg_free_result($res1);
///////////////////////////////////////////////////////// QUERY 2 /////////////////////////////////////////////////////////////

	$superquery = "SELECT t1p.estado_id, t1p.municipio_id, t1p.sexo, t1p.positivosx, t3.activo_viv, t4.activo_def,
			t1p.tipo_paciente AS enhospi, t1d.fallecidosx, t2.sospechoso, 
			(t3.activo_viv - t5.activo_vivant) AS nvos_actvviv, (t4.activo_def - t6.activo_defant) AS nvos_actvdef,

			CASE WHEN (t1p.positivosx - t7p.positivosxant) IS NOT NULL 
			THEN (t1p.positivosx - t7p.positivosxant) ELSE 0 END AS nvos_positivos, 
			CASE WHEN (t1d.fallecidosx - t7d.fallecidosxant) IS NOT NULL 
			THEN (t1d.fallecidosx - t7d.fallecidosxant) ELSE 0 END AS nvos_fallecidos
			FROM			 			 

(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, tipo_paciente, sexo, COUNT(clasificacion_final) AS positivosx
			 FROM covid19 	 
			 WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual'
			 GROUP BY municipio_res, entidad_res, tipo_paciente, sexo ORDER BY estado_id, municipio_id) AS t1p 
LEFT JOIN
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, tipo_paciente, sexo, COUNT(fecha_def) AS fallecidosx
			 FROM covid19 	 
			 WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaactual' AND fecha_def IS NOT NULL
			 GROUP BY municipio_res, entidad_res, tipo_paciente, sexo ORDER BY estado_id, municipio_id) AS t1d
ON t1p.estado_id=t1d.estado_id AND t1p.municipio_id=t1d.municipio_id	AND t1p.tipo_paciente=t1d.tipo_paciente AND t1p.sexo=t1d.sexo		

LEFT JOIN 			  
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, COUNT(clasificacion_final) AS sospechoso
			 FROM covid19 	 
			 WHERE clasificacion_final=6 AND fecha_actualizacion='$fechaactual' 
			 GROUP BY municipio_res, entidad_res ORDER BY estado_id, municipio_id) AS t2
ON t1p.estado_id=t2.estado_id AND t1p.municipio_id=t2.municipio_id

LEFT JOIN 			 
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, COUNT(fecha_sintomas) AS activo_viv 
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_def IS NULL 
			AND fecha_sintomas > DATE(CAST('$fechaactual' AS DATE) - CAST('14 days' AS INTERVAL)) AND fecha_actualizacion='$fechaactual'
			GROUP BY municipio_res, entidad_res ORDER BY estado_id, municipio_id) AS t3		
ON t1p.estado_id=t3.estado_id AND t1p.municipio_id=t3.municipio_id

LEFT JOIN 		 
(SELECT municipio_res AS municipio_id, entidad_res AS estado_id, COUNT(fecha_sintomas) AS activo_def 
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_def IS NOT NULL 
			AND fecha_sintomas > DATE(CAST('$fechaactual' AS DATE) - CAST('14 days' AS INTERVAL)) AND fecha_actualizacion='$fechaactual'
			GROUP BY municipio_res, entidad_res ORDER BY estado_id, municipio_id) AS t4
ON t1p.estado_id=t4.estado_id AND t1p.municipio_id=t4.municipio_id			

LEFT JOIN 
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, COUNT(fecha_sintomas) AS activo_vivant 
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_def IS NULL 
			AND fecha_sintomas > DATE(CAST('$fechaanterior' AS DATE) - CAST('14 days' AS INTERVAL)) AND fecha_actualizacion='$fechaanterior'
			GROUP BY municipio_res, entidad_res ORDER BY estado_id, municipio_id) AS t5	
ON t1p.estado_id=t5.estado_id AND t1p.municipio_id=t5.municipio_id	

LEFT JOIN 
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, COUNT(fecha_sintomas) AS activo_defant 
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_def IS NOT NULL 
			AND fecha_sintomas > DATE(CAST('$fechaanterior' AS DATE) - CAST('14 days' AS INTERVAL)) AND fecha_actualizacion='$fechaanterior'
			GROUP BY municipio_res, entidad_res ORDER BY estado_id, municipio_id) AS t6	
ON t1p.estado_id=t6.estado_id AND t1p.municipio_id=t6.municipio_id	

LEFT JOIN 
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, tipo_paciente, sexo, COUNT(clasificacion_final) AS positivosxant
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaanterior'
			GROUP BY municipio_res, entidad_res, tipo_paciente, sexo ORDER BY estado_id, municipio_id) AS t7p
ON t1p.estado_id=t7p.estado_id AND t1p.municipio_id=t7p.municipio_id	AND t1p.tipo_paciente=t7p.tipo_paciente AND t1p.sexo=t7p.sexo

LEFT JOIN 
(SELECT entidad_res AS estado_id, municipio_res AS municipio_id, tipo_paciente, sexo, COUNT(fecha_def) AS fallecidosxant
			FROM covid19 
			WHERE clasificacion_final<=3 AND fecha_actualizacion='$fechaanterior' AND fecha_def IS NOT NULL
			GROUP BY municipio_res, entidad_res, tipo_paciente, sexo ORDER BY estado_id, municipio_id) AS t7d
ON t1p.estado_id=t7d.estado_id AND t1p.municipio_id=t7d.municipio_id AND t1p.tipo_paciente=t7d.tipo_paciente AND t1p.sexo=t7d.sexo
	
ORDER BY t1p.estado_id, t1p.municipio_id, sexo, enhospi ASC;";

	$djson = array();
	$arregloent = array();
	$arrentdata = array();
	$res2 = pg_query($conexion, $superquery) or die('La consulta 2 falló: ' . pg_last_error());
	$nom = "COVID-19";

	if(pg_num_rows($res2) != 0) {
		$valmax = max($aentmunpos);
		$x = log($valmax);
		$intervalo = $x / 4;

	} else {
		$intervalo = 0;		
	}

	pg_result_seek($res2, 0);
	
	$arangos = [exp($intervalo), exp(2 * $intervalo), exp(3 * $intervalo) , exp(4 * $intervalo)];

	$i=0;
	while ($fila = pg_fetch_array($res2, NULL, PGSQL_ASSOC)) {

		$aid = $alcance == 'Nacional' ? [$fila['estado_id'], $fila['municipio_id']] : [$fila['municipio_id']];
		$nhospi = $fila['enhospi'];
		$sexo = $fila['sexo'];
		$positivosx = $fila['positivosx'] != NULL ? $fila['positivosx'] : 0;
		$nvos_positivos = $fila['nvos_positivos'] != NULL ? $fila['nvos_positivos'] : 0;
		$activo_viv = $fila['activo_viv'] != NULL ? $fila['activo_viv'] : 0;
		$activo_def = $fila['activo_def'] != NULL ? $fila['activo_def'] : 0;
		$nvos_actvviv = $fila['nvos_actvviv'] != NULL ? $fila['nvos_actvviv'] : 0;
		$nvos_actvdef = $fila['nvos_actvdef'] != NULL ? $fila['nvos_actvdef'] : 0;
		$deadsx = $fila['fallecidosx'] != NULL ? $fila['fallecidosx'] : 0;
		$nvos_fallecidos = $fila['nvos_fallecidos'] != NULL ? $fila['nvos_fallecidos'] : 0;
		$sosp = $fila['sospechoso']  != NULL ? $fila['sospechoso'] : 0;

		$cvec = claveCompleta( $aid[0], $aid[1]);
		$posentmun = $aentmunpos[array_search($cvec, $acvecompleta)];
		$pobtotmun = $aentmunptot[array_search($cvec, $acvecompleta)];
		if($posentmun <= $arangos[0])
			$color = $arangoscol[0];
		if($arangos[0] < $posentmun && $posentmun <= $arangos[1])
			$color = $arangoscol[1];
		if($arangos[1] < $posentmun && $posentmun <= $arangos[2])
			$color = $arangoscol[2];
		if($arangos[2] < $posentmun)
			$color = $arangoscol[3];

		if(count($aid) > 1)
			$arregloent[$i++] = array('edo_id'=> $aid[0], 'mun_id'=> $aid[1], 'pobmun'=> $pobtotmun, 'color' => "$color", 
							'sexo' => $sexo, 'positivosx' => $positivosx,	'actv_viv' => $activo_viv, 'actv_def' => $activo_def, 
							'enhospi' => $nhospi, 'deadsx' => $deadsx, 'sosp' => $sosp, 
							'nvos_actvviv' => $nvos_actvviv, 'nvos_actvdef' => $nvos_actvdef, 'nvos_positivos' => $nvos_positivos, 'nvos_fallecidos' => $nvos_fallecidos);
		else
			$arregloent[$i++] = array('mun_id'=> $aid[0], 'color' => "$color", 'positivosx' => $positivosx );


	}	 
	 
	$arjs = array('nombre_tema' => "$nom", 'nombre_alcance' => "$alcance", 'alcance' => $arregloent);
	$djson = json_encode($arjs);
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res2);

	// Cerrando la conexión
	pg_close($conexion);
	return $djson;

}

/**
 * Función encargada de obtener la estructura del mapa coroplético en formato json, apartir de un arreglo generado por el query a la base de datos
 * @return json Devuelve la estructura json
 */
function obtenEdadesJson() {

	global $arangos;
	global $arangoscol;
	global $fechaactual;
	global $fechaanterior;

	$conexion = conectaCOVID19();
	$eid = 0;
	$alcance = "Nacional";


///////////////////////////////////////////////////////// QUERY 2 /////////////////////////////////////////////////////////////

	$query = "SELECT * FROM edadescovid ORDER BY estado_id, municipio_id ASC;";

	$djson = array();
	$arregloent = array();
	$arrentdata = array();
	$res = pg_query($conexion, $query) or die('La consulta del query falló: ' . pg_last_error());
	$nom = "COVID-19";

	pg_result_seek($res, 0);
	
	$i=0;
	while ($fila = pg_fetch_array($res, NULL, PGSQL_ASSOC)) {

		$aid = $alcance == 'Nacional' ? [$fila['estado_id'], $fila['municipio_id']] : [$fila['municipio_id']];
		$edaa13pos = $fila['edaa13pos'];		
		$nvos_a13pos = $fila['nvos_a13pos'] != NULL ? $fila['nvos_a13pos'] : 0;
		$edaa13def = $fila['edaa13def'];
		$nvos_a13def = $fila['nvos_a13def'] != NULL ? $fila['nvos_a13def'] : 0;

		$eda14a19pos = $fila['eda14a19pos'];		
		$nvos_14a19pos = $fila['nvos_14a19pos'] != NULL ? $fila['nvos_14a19pos'] : 0;
		$eda14a19def = $fila['eda14a19def'];
		$nvos_14a19def = $fila['nvos_14a19def'] != NULL ? $fila['nvos_14a19def'] : 0;

		$eda20a29pos = $fila['eda20a29pos'];		
		$nvos_20a29pos = $fila['nvos_20a29pos'] != NULL ? $fila['nvos_20a29pos'] : 0;
		$eda20a29def = $fila['eda20a29def'];
		$nvos_20a29def = $fila['nvos_20a29def'] != NULL ? $fila['nvos_20a29def'] : 0;

		$eda30a39pos = $fila['eda30a39pos'];		
		$nvos_30a39pos = $fila['nvos_30a39pos'] != NULL ? $fila['nvos_30a39pos'] : 0;
		$eda30a39def = $fila['eda30a39def'];
		$nvos_30a39def = $fila['nvos_30a39def'] != NULL ? $fila['nvos_30a39def'] : 0;


		$eda40a49pos = $fila['eda40a49pos'];		
		$nvos_40a49pos = $fila['nvos_40a49pos'] != NULL ? $fila['nvos_40a49pos'] : 0;
		$eda40a49def = $fila['eda40a49def'];
		$nvos_40a49def = $fila['nvos_40a49def'] != NULL ? $fila['nvos_40a49def'] : 0;

		$eda50a59pos = $fila['eda50a59pos'];		
		$nvos_50a59pos = $fila['nvos_50a59pos'] != NULL ? $fila['nvos_50a59pos'] : 0;
		$eda50a59def = $fila['eda50a59def'];
		$nvos_50a59def = $fila['nvos_50a59def'] != NULL ? $fila['nvos_50a59def'] : 0;

		$eda60maspos = $fila['eda60maspos'];		
		$nvos_60maspos = $fila['nvos_60maspos'] != NULL ? $fila['nvos_60maspos'] : 0;
		$eda60masdef = $fila['eda60masdef'];
		$nvos_60masdef = $fila['nvos_60masdef'] != NULL ? $fila['nvos_60masdef'] : 0;

		$cvec = claveCompleta( $aid[0], $aid[1]);

		if(count($aid) > 1)
			$arregloent[$i++] = array('edo_id'=> $aid[0], 'mun_id'=> $aid[1],  
							'edaa13pos' => $edaa13pos, 'nvos_a13pos' => $nvos_a13pos, 
							'edaa13def' => $edaa13def, 'nvos_a13def' => $nvos_a13def,
							'eda14a19pos' => $eda14a19pos, 'nvos_14a19pos' => $nvos_14a19pos, 
							'eda14a19def' => $eda14a19def, 'nvos_14a19def' => $nvos_14a19def,
							'eda20a29pos' => $eda20a29pos, 'nvos_20a29pos' => $nvos_20a29pos, 
							'eda20a29def' => $eda20a29def, 'nvos_20a29def' => $nvos_20a29def,							
							'eda30a39pos' => $eda30a39pos, 'nvos_30a39pos' => $nvos_30a39pos, 
							'eda30a39def' => $eda30a39def, 'nvos_30a39def' => $nvos_30a39def,	
							'eda40a49pos' => $eda40a49pos, 'nvos_40a49pos' => $nvos_40a49pos, 
							'eda40a49def' => $eda40a49def, 'nvos_40a49def' => $nvos_40a49def,	
							'eda50a59pos' => $eda50a59pos, 'nvos_50a59pos' => $nvos_50a59pos, 
							'eda50a59def' => $eda50a59def, 'nvos_50a59def' => $nvos_50a59def,	
							'eda60maspos' => $eda60maspos, 'nvos_60maspos' => $nvos_60maspos, 
							'eda60masdef' => $eda60masdef, 'nvos_60masdef' => $nvos_60masdef);
		else
			$arregloent[$i++] = array('mun_id'=> $aid[0] );


	}	 
	 
	$arjs = array('nombre_tema' => "$nom", 'nombre_alcance' => "$alcance", 'alcance' => $arregloent);
	$djson = json_encode($arjs);
	// Liberando el conjunto de clasificacion_finals
	pg_free_result($res);

	// Cerrando la conexión
	pg_close($conexion);
	return $djson;

}