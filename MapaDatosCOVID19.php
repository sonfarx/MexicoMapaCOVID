<?php 

ini_set('display_errors', 1);
error_reporting(E_ALL & ~E_NOTICE);

/***********************************************************/
/*** Inicia la carga a buffer de la generación dinámica ***/
/***********************************************************/
ob_start();
require_once("ConstruyeJSON.php");
 $aentidades = ['Estados Unidos Mexicanos', 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Coahuila', 'Colima', 'Chiapas',
                        'Chihuahua', 'Ciudad de México', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
                        'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
  $arrhtmls = glob('./*.html');
  rsort($arrhtmls);
  $archivofechas = fopen("./fechas.csv", "w") or die("Incapaz de abrir el archivo");
  if( $archivofechas ) {
    fwrite($archivofechas, "fecha\n");
    for($i = 0; $i < count($arrhtmls); $i++) {
      $fecha = str_replace(["./", ".html"], "", $arrhtmls[$i])."\n";
      fwrite($archivofechas, $fecha);
    }
  }
    fclose($archivofechas);        
 ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <link rel="stylesheet" href="css/fa/all.css">
  <link href="https://fonts.googleapis.com/css2?family=Oswald&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/ol.css">
  <link rel="stylesheet" href="css/estiloMapa-ol-covid.css">  
  <meta charset="UTF-8">
  <title>Mapa COVID-19</title>
</head>
 <body>
  <script src="js/d3.min.js"></script>
  <script src="js/cargaSelect.js"></script>
  <div id="titulofechaid"></div>
  <div id="contenedor-ap-id"></div>
    <div id="mapaid" class="mapacl"></div>
    <hr>
      <div class="mapapie">
        <div class="selectcl">
          <select name="entidades" id="volar-a-id" class="volar-a-cl">
            <option value="">Seleccione Estado…</option>
            <?php 
              for($i = 0; $i < count($aentidades); $i++) {

            ?>
              <option value="<?= $i ?>"><?= $aentidades[$i]; ?></option>

            <?php
              }
             ?>

          </select>
      </div>
      <div class="selectcl">
          <select name="fechas" id="fechaid"></select>
      </div>
      <div class="inputscl">
        <div class="chkcl"><input type="checkbox" id="leyendaid" name="leyenda" checked><label for="leyenda">Mostrar leyenda</label></div>
        <div class=""><input type="radio" id="sexoid" name="tipodato" checked><label for="tipodato">Sexo</label></div>
        <div class=""><input type="radio" id="edadid" name="tipodato"><label for="tipodato">Edad</label></div>
      </div>
      <div class="notascl">
        <ul>
          <li><b>IL:</b> Índice de letalidad</li>
          <li><b>(-14d):</b> Activos en rango desde 14 días anteriores a la fecha de actualización.</li>
          <li>Nota 1: Los días transcurridos son a partir del primer caso covid confirmado como positivo con fecha de síntomas el 13 de enero 2020 (según la fuente).</li>
          <li>Nota 2: Hay pacientes con virus activo de más de 14 días en tratamiento, y que si finalmente fallecen, no se verá reflejado en los -14d pero si en nuevo fallecido.</li>
          <li>Nota 3: Si hay <strong>[<i>n</i> menos]</strong> confirmados y/o fallecidos, o fallecidos negativos, es porque realizaron modificación de registro(s) del dia actualizado respecto al anterior en la tabla fuente y la diferencia de resultados de esos dos dias dan un número negativo, probablemente debido a falsos positivos del virus SARS-CoV-2 y que, en una prueba posterior se confirmó negativo o por otras razones.</li>
        </ul>
      </div>
    </div>
    <!-- </div> -->

    <script src="js/ol.js"></script>
    <script src="js/mapa-ol-covid.js"></script>  
    <script>
      <?php $atotales = obtenDatosTotales(); 
            $aentpob = $atotales[0];
            $aentpos = $atotales[1];
            $aentdef = $atotales[2];
            $aentsos = $atotales[3];
            $amujerpos = $atotales[4];
            $amhompos = $atotales[5];
            $fechact = $atotales[6];
            $fechant = $atotales[13];
            $aentactv_viv = $atotales[7];
            $aentactv_def = $atotales[8];
            $anvoentactv_viv = $atotales[9];
            $anvoentactv_def = $atotales[10];     
            $anvosentpos = $atotales[11];  
            $anvosentdef = $atotales[12];     
            $atotales = null;
            $atotayer = obtenDatosTotalesAyer();
            $totposayer = $atotayer[0];
            $totdefayer = $atotayer[1];

            if (file_exists('./index.html') && !file_exists('./'.$fechant.".html")) {
              rename('./index.html', './'.$fechant.'.html');
            }
      ?>
      var totposayer = <?= $totposayer; ?>;
      var totdefayer = <?= $totdefayer; ?>;
      var aentidades = [<?= "'".implode("','", $aentidades)."'"; ?>];
      var aentpob = [<?= array_sum($aentpob).', '.implode(",", $aentpob); ?>];
      var aentpos = [<?= array_sum($aentpos).', '.implode(",", $aentpos); ?>];
      var aentactv_viv = [<?= array_sum($aentactv_viv).', '.implode(",", $aentactv_viv); ?>];      
      var anvoentactv_viv = [<?= array_sum($anvoentactv_viv).', '.implode(",", $anvoentactv_viv); ?>];       
      var aentactv_def = [<?= array_sum($aentactv_def).', '.implode(",", $aentactv_def); ?>];             
      var anvoentactv_def = [<?= array_sum($anvoentactv_def).', '.implode(",", $anvoentactv_def); ?>];     
      var anvosentpos = [<?= array_sum($anvosentpos).', '.implode(",", $anvosentpos); ?>];     
      var anvosentdef = [<?= array_sum($anvosentdef).', '.implode(",", $anvosentdef); ?>];     
      var aentdef = [<?= array_sum($aentdef).', '.implode(",", $aentdef); ?>];
      var aentsos = [<?= array_sum($aentsos).', '.implode(",", $aentsos); ?>];        
      var aentmuj = [<?= array_sum($amujerpos).', '.implode(",", $amujerpos); ?>];      
      var aenthom = [<?= array_sum($amhompos).', '.implode(",", $amhompos); ?>];     
      var fechact = "<?= str_replace("-", " ", $fechact); ?>";
      var fechant = "<?= str_replace("-", " ", $fechant); ?>";
      var zoom;
      var edo_id = '00';
      var datosJsonAlcance;
      var datosEdadesJson = {};
      var divtit = document.getElementById("titulofechaid");
      const diaant = new Date(fechant);
      const diaact  = new Date(fechact);
      const dia_o = diaant.toLocaleString("es-MX", {weekday: "long", day: "numeric", month: "long"});
      const dia_f = diaact.toLocaleString("es-MX", {weekday: "long", day: "numeric", month: "long", year: "numeric"});
      divtit.innerHTML = "<strong>Fechas desde el " + dia_o + " hasta el " + dia_f + "</strong>";
      d3.json("geojsons/centros_geo_estados.json").then(function(data) {
        let centropais = data.centros[0].centro; // El centro puede ser un centro de alcance o asignarse una coordenada     

        let clndf = centropais[0];
        let cltdf = centropais[1];
        zoom = data.centros[0].zoom;
        presentaMapa([clndf, cltdf], zoom);
        <?php 
        echo "estableceData(data.centros);\n";
        echo "datosJsonAlcance = " . obtenMCoroJson() . ";\n"; 
        echo "datosEdadesJson = " . obtenEdadesJson() . ";\n";
        echo "agregaMapaCoropletico(edo_id, datosJsonAlcance, datosEdadesJson);\n";
        ?>
        agregaMapaPol(edo_id);
        arangos = [<?php for($i = 0; $i < count($arangos); $i++) { echo ($i == (count($arangos) -1)) ? "'$arangos[$i]'" : "'$arangos[$i]',"; }; ?>];
        arangoscol = [<?php for($i = 0; $i < count($arangoscol); $i++) { echo ($i == (count($arangoscol) -1)) ? "'$arangoscol[$i]'" : "'$arangoscol[$i]',"; }; ?>];
        muestraLeyenda(arangos, arangoscol);
        const chbxley = document.getElementById("leyendaid");
        const ley = document.getElementsByClassName('leyendacl')[0];        
        chbxley.addEventListener('change', (event) => {
          if(chbxley.checked) {
            ley.style.visibility = 'visible';
          } else {
            ley.style.visibility = 'hidden';
          }
        });
        // setTime();
      });

    </script>    
</body>
</html>

<?php 

/** Guardando la salida capturada en el buffer a un archivo html **/
file_put_contents('index.html', ob_get_contents());

/** Termina el buffer y presenta la página **/
ob_end_flush();

 ?>
