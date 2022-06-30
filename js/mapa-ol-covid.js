/**
 * Autor: Francisco Angel Ramírez Lopez
 */
var data_ents;
var entcoord;
var entid = 0;
var zent;
var totaldefcasa = 0;
var colnoactv = '#B1F0C1'; // verde claro
var colorfrontera = '#000000'; // negro
// var colnoactv = '#C9B1F0'; // violeta claro
// var colorfrontera = '#D800FF'; // purpura-magenta
var strgba = 'rgba(242, 242, 242, 0.6)'; // Color de default de los municipios




function estableceData(data) {
  data_ents = data;
  entcoord = ol.proj.fromLonLat(data_ents[entid].centro);
  zent = data_ents[entid].zoom;
}



function threeHoursAgo() {
  return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * 3);
}

var extent = ol.proj.transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
var startDate = threeHoursAgo();
var frameRate = 0.5; // frames per second
var animationId = null;
var mapa;
var layers;



function presentaMapa(centros, zoom) {

  urlklok = 'https://maps-cdn.salesboard.biz/styles/klokantech-3d-gl-style/{z}/{x}/{y}.png'; // Klokantech 3D
  urlwiki = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png'; // wikimedia
  urlcdbpos = 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'; // CartoDB light 'positron'
  urltrnsp = 'http://tile2.opencyclemap.org/transport/{z}/{x}/{y}.png'; // Transport (requiere api key)
  urlthunfo = 'http://{a-c}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png'; // Thunderforest Outdoorsy (requiere api key)
  urlsthc = 'http://{a-c}.tile.stamen.com/toner/{z}/{x}/{y}.png'; // Stamen toner alto contraste B/N
  urlosm = 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Default de Open Street maps
  urlthunfl = 'http://{a-c}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png'; // Thunderforest Landscape (requiere api key)
  urlcdbdrk = 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'; // CartoDB 'Dark Matter'
  urlstw  = 'http://{a-c}.tile.stamen.com/watercolor/{z}/{x}/{y}.png'; // Stamen Watercolor



  capaMapa = new ol.source.OSM({
    url: urlcdbpos
  });

  layers = [
    new ol.layer.Tile({source: capaMapa})

    // new ol.layer.Tile({
    //   source: new ol.source.Stamen({
    //     layer: 'terrain'
    //   })
    // })
    // ,
    // new ol.layer.Tile({
    //   extent: extent,
    //   source: new ol.source.TileWMS({
    //     attributions: ['Secretaría de Salud'],
    //     url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
    //     params: {'LAYERS': 'nexrad-n0r-wmst'}
    //   })
    // })
  ];

  mapa = new ol.Map({
    layers: layers,
    target: 'mapaid',
    view: new ol.View({
      center: ol.proj.fromLonLat(centros), // coordenadas del centro del mapa a visualizar
      zoom: zoom
    })
  });

  mapa.on('moveend', alMover);
}


/**
 * Función que muestra el mapa nacional o estatal a un solo color predefinido y con fronteras, 
 * sin valores de información.
 * @param  {String} ageojson    Nombre del archivo geojson con su ruta
 * @return {null}             nada
 */
function agregaMapaPol(ageojson) {
  let archivogeojson = "geojsons/00.geojson";
  // let op = zoom > 11 ? 0 : 0.2;
  // let territorioc = '#CBCBCB';
  // let aresalte = '#FFFFFF';
  // let carac;

  // La capa vectorial del geojson, aqui se construye a aprtir del geojson con el estilo predefindo en la variable estilo
  var capaGeoJSON = new ol.layer.Vector({
        renderMode: 'image',
        source: new ol.source.Vector({
          url: archivogeojson,
          format: new ol.format.GeoJSON()
        }),
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: hex2rgba(colorfrontera, 0.9),
            width: 0.4
          })
        }),       
        zIndex: 10
  });      

  let geojsonly = capaGeoJSON;
  mapa.addLayer(geojsonly);

} // agregaMapaPol




/**
 * Función que construye la clave completa del municipio
 * @param  {integer} eid El id de entidad
 * @param  {integer} mid El id del municipio
 * @return {String}     El id completo formado por el id del estado + el id del municipio
 */
function claveCompleta(eid, mid) {
  let seid = eid.toString();
  let smid = mid.toString();
  if(eid < 10 )
    seid = "0" + seid;
  if(mid < 100){
    if(mid < 10)
      smid = "00" + smid;
    else
      smid = "0" + smid;
  }

  return seid + smid;

}

/**
 * Crea la capa de superposición sobre el mapa al cual se agregará
 * @param  {Object} contenedor El div que contiene toda la construcción para esta capa de superposición
 * @return {Overlay}            El objeto tipo overlay de la capa de superposición ya construida.
 */
function obtenOverlay(contenedor) {
  var overlay = new ol.Overlay({
      element: contenedor,
      autoPan: false
  });
  return overlay;
}


/**
 * Función que contruye el mapa vectorial a partir de mapa geojson y datos json para coloreado
 * @param  {String}   ageojson      Es el nombre del archivo  del mapa vectorial
 * @param  {JSON}     data          Es el objeto de datos json
 * @param  {float}    op            Valor de opacidad para esta capa
 * @param  {String}   bresalte      Es el color de resaltado de la frontera en fromato hexadecimal #XXXXXX
 * @param  {String}   aresalte      Es el color de rellenado de una entidad o municipio en fromato hexadecimal #XXXXXX* 
 * @return {null}                   nada
 */
function agregaMapaCoropletico(ageojson, data, dataeda) {

  var dato = [];
  dato['edo_id'] = [];
  dato['mun_id'] = [];
  dato['pobmun'] = [];
  dato['tot_posmun'] = [];
  dato['tot_actvvivmun'] = [];
  dato['nvosactvvivmun'] = []; 
  dato['tot_actvdefmun'] = [];
  dato['nvosactvdefmun'] = [];
  dato['tot_sosmun'] = [];
  dato['tot_defmun'] = [];
  dato['tot_nvosposmun'] = [];
  dato['tot_nvosdefmun'] = [];
  dato['color'] = [];
  dato['mujer'] = [];
  dato['hombre'] = [];
  dato['hospital'] = [];

  var datosentmun = [];
  var datosentmuneda = [];
  var coropletico = null;
  let agj = "geojsons/00mun.geojson";

  let bresalte = "#FA3434";
  let aresalte = "#FFFFFF";
  let op = 0.6;
  let opr = 0.7; 
  /** 
   *  Construcción de los divs que contendrán el tooltip 
   */
  var contenido;
  var contenidotabla;
  var contenedor = document.getElementById('popup-mapapol');
  if( contenedor == null) {
    contenedor = document.createElement("div");
    contenedor.id = "popup-mapapol";
    contenedor.className = "ol-popup";
    contenido = document.createElement("div");
    contenido.id = "popup-content-mapapol";
    contenidotabla = document.createElement("div");
    contenidotabla.className = "divTable paleBlueRows";
    contenedor.appendChild(contenido);
    contenedor.appendChild(contenidotabla);
  } else {
    contenido = document.getElementById('popup-content-mapapol');
  }



  /**
   * Crea una overlay (superposición) para anclar el popup al mapa.
   */
  var overlay = obtenOverlay(contenedor);
  var totaldatosjson = data.alcance.length;
  var totaldatosedadesjson = dataeda.alcance.length;
  var totposmun = 0;
  var totnvoposmun = 0;
  var totaldefmun = 0;
  var totnvodefmun = 0;
  // var totalpositivo = 0;
  // var totaldefuncion = 0;
  totaldefcasa = 0;
  
  for ( i = 0; i < totaldatosjson; i++) {
    var adata;
    let eid = data.alcance[i].edo_id;
    let mid = data.alcance[i].mun_id;
    let pobmun = data.alcance[i].pobmun;
    let cvecomact = claveCompleta(eid, mid);
    let cvecoreg = claveCompleta(eid, mid);
    let actvviv = parseInt(data.alcance[i].actv_viv);
    let nvosactvviv = parseInt(data.alcance[i].nvos_actvviv);
    let actvdef = parseInt(data.alcance[i].actv_def);
    let nvosactvdef = parseInt(data.alcance[i].nvos_actvdef);
    let sosp = parseInt(data.alcance[i].sosp);
    // totalpositivo += parseInt(data.alcance[i].positivosx);
    // totaldefuncion += parseInt(data.alcance[i].deadsx);
    totaldefcasa = data.alcance[i].enhospi == 1 ? totaldefcasa + 1 : totaldefcasa;
    if(i == 0) {
      cvecoreg = claveCompleta(eid, mid);
      datosentmun[cvecoreg] = [];
      dato["edo_id"].push(eid);
      dato["mun_id"].push(mid);
      dato['pobmun'].push(pobmun);
      totposmun = parseInt(data.alcance[0].positivosx);
      totnvoposmun = parseInt(data.alcance[0].nvos_positivos);
      totnvodefmun = parseInt(data.alcance[0].nvos_fallecidos);
      dato["color"].push(hex2rgba(data.alcance[0].color, op));  
      dato["tot_actvvivmun"].push(actvviv);  
      dato["nvosactvvivmun"].push(nvosactvviv); 
      dato["tot_actvdefmun"].push(actvdef);
      dato["nvosactvdefmun"].push(nvosactvdef); 
      dato["tot_sosmun"].push(sosp); 
      totaldefmun = parseInt(data.alcance[0].deadsx);

      adata = [data.alcance[0].sexo, data.alcance[0].positivosx, data.alcance[0].deadsx, data.alcance[0].enhospi, data.alcance[0].nvos_positivos, data.alcance[0].nvos_fallecidos];
      datosentmun[cvecoreg].push(adata);
    } else { 
        
        if(eid == dato["edo_id"][dato["edo_id"].length - 1] && mid == dato["mun_id"][dato["mun_id"].length - 1]) {
         
          totposmun += parseInt(data.alcance[i].positivosx);
          totnvoposmun += parseInt(data.alcance[i].nvos_positivos);
          totnvodefmun += parseInt(data.alcance[i].nvos_fallecidos);
          totaldefmun += parseInt(data.alcance[i].deadsx);
          adata = [data.alcance[i].sexo, data.alcance[i].positivosx, data.alcance[i].deadsx, data.alcance[i].enhospi, data.alcance[i].nvos_positivos, data.alcance[i].nvos_fallecidos];
          datosentmun[cvecoreg].push(adata);
      
        } else {
          dato["edo_id"].push(eid);
          dato["mun_id"].push(mid);
          dato['pobmun'].push(pobmun);
          dato['tot_posmun'].push(totposmun);
          dato['tot_defmun'].push(totaldefmun);    
          dato['tot_nvosposmun'].push(totnvoposmun);
          dato['tot_nvosdefmun'].push(totnvodefmun);
          dato["color"].push(hex2rgba(data.alcance[i].color, op));  
          dato["tot_actvvivmun"].push(actvviv); 
          dato["nvosactvvivmun"].push(nvosactvviv); 
          dato["tot_actvdefmun"].push(actvdef);
          dato["nvosactvdefmun"].push(nvosactvdef); 
          dato["tot_sosmun"].push(sosp); 
          cvecoreg = claveCompleta(eid, mid);
          adata = [data.alcance[i].sexo, data.alcance[i].positivosx, data.alcance[i].deadsx, data.alcance[i].enhospi, data.alcance[i].nvos_positivos, data.alcance[i].nvos_fallecidos];
          datosentmun[cvecoreg] = [];
          datosentmun[cvecoreg].push(adata);
          totposmun = parseInt(data.alcance[i].positivosx);   
          totnvoposmun = parseInt(data.alcance[i].nvos_positivos);
          totaldefmun = parseInt(data.alcance[i].deadsx);   
          totnvodefmun = parseInt(data.alcance[i].nvos_fallecidos);

       
        }
    }
    if(i == totaldatosjson - 1) {
        dato['tot_posmun'].push(totposmun);
        dato['tot_defmun'].push(totaldefmun);
        dato['tot_nvosposmun'].push(totnvoposmun);
        dato['tot_nvosdefmun'].push(totnvodefmun);
    }

  } // for totaldatosjson

  /*************************** Edades json ********************************/

  for ( i = 0; i < totaldatosedadesjson; i++) {
    var adataeda;
    let eid = dataeda.alcance[i].edo_id;
    let mid = dataeda.alcance[i].mun_id;
    let cvecomact = claveCompleta(eid, mid);
    let cvecoreg = claveCompleta(eid, mid);
    datosentmuneda[cvecoreg] = [];
    cvecoreg = claveCompleta(eid, mid);
    adataeda = [parseInt(dataeda.alcance[i].edaa13pos), parseInt(dataeda.alcance[i].nvos_a13pos), 
                parseInt(dataeda.alcance[i].edaa13def), parseInt(dataeda.alcance[i].nvos_a13def),
                parseInt(dataeda.alcance[i].eda14a19pos), parseInt(dataeda.alcance[i].nvos_14a19pos), 
                parseInt(dataeda.alcance[i].eda14a19def), parseInt(dataeda.alcance[i].nvos_14a19def),
                parseInt(dataeda.alcance[i].eda20a29pos), parseInt(dataeda.alcance[i].nvos_20a29pos), 
                parseInt(dataeda.alcance[i].eda20a29def), parseInt(dataeda.alcance[i].nvos_20a29def),
                parseInt(dataeda.alcance[i].eda30a39pos), parseInt(dataeda.alcance[i].nvos_30a39pos), 
                parseInt(dataeda.alcance[i].eda30a39def), parseInt(dataeda.alcance[i].nvos_30a39def),
                parseInt(dataeda.alcance[i].eda40a49pos), parseInt(dataeda.alcance[i].nvos_40a49pos), 
                parseInt(dataeda.alcance[i].eda40a49def), parseInt(dataeda.alcance[i].nvos_40a49def),
                parseInt(dataeda.alcance[i].eda50a59pos), parseInt(dataeda.alcance[i].nvos_50a59pos), 
                parseInt(dataeda.alcance[i].eda50a59def), parseInt(dataeda.alcance[i].nvos_50a59def),
                parseInt(dataeda.alcance[i].eda60maspos), parseInt(dataeda.alcance[i].nvos_60maspos), 
                parseInt(dataeda.alcance[i].eda60masdef), parseInt(dataeda.alcance[i].nvos_60masdef),
                ];
    let sumpos = 0;
    let sumnvopos = 0;
    let sumdef = 0;
    let sumnvodef = 0;

    for(j = 0; j < 28; j++) {
      if(j * 4 <= 27 ) {
              sumpos += adataeda[j * 4];
              sumnvopos += adataeda[(j * 4) + 1];
              sumdef += adataeda[(j * 4) + 2];
              sumnvodef += adataeda[(j * 4) + 3];
      }
      else
        break;
    }

    adataeda.push(sumpos);
    adataeda.push(sumnvopos);
    adataeda.push(sumdef);
    adataeda.push(sumnvodef);
    datosentmuneda[cvecoreg].push(adataeda);
  } // for totaldatosedadesjson


  claveid =  ["CVE_ENT", "CVE_MUN"];
  // variable que obtiene los colores para un mapa coropletico a partir del archivo json 
  // que contiene los colores para cada entidad
  let k = 1;
  coropletico = function(feature, res) {


     for(i = 0; i < data.alcance.length; i++) {
        let cve_ent = feature.get(claveid[0])/1; // para quitarle el 00,01, 02, etc... y dejarlos en valores 1, 2, 3, etc...
        let cve_mun = feature.get(claveid[1])/1; // para quitarle el 00,01, 02, etc... y dejarlos en valores 1, 2, 3, etc...   

        if( cve_ent == dato['edo_id'][i] && cve_mun == dato['mun_id'][i]) {
          if(dato['tot_actvdefmun'][i] == 0 && dato['tot_actvvivmun'][i] == 0 && dato['tot_posmun'][i] > 0)
            dato['color'][i] = hex2rgba(colnoactv, op);
            return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                    color: hex2rgba('#333333', op),
                    width: 0.5
                }),
                fill: new ol.style.Fill({
                    color: dato['color'][i]                    
                })
            });// return estilo;
        } // if           
      } // for

      return new ol.style.Style({
              stroke: new ol.style.Stroke({
              color: hex2rgba('#333333', op),
              width: 0.5
          }),
          fill: new ol.style.Fill({
              
              color:  strgba// relleno de cada entidad
          })
      });
    } // coropletico

  // La capa vectorial del geojson, aqui se construye a aprtir del geojson con el estilo predefindo en la variable estilo
  var capaGeoJSON = new ol.layer.Vector({
        renderMode: 'image',
        source: new ol.source.Vector({
          url: agj,
          format: new ol.format.GeoJSON()
        }),

        style: function(feature, res) {
          return  coropletico(feature, res)
        },
        zIndex: 2
  });     
  

  //////////////////// Bloque de interaccion sobre la capa vectorial ////////////////

  // Variable de características de la superposición de la capa de mapa vectorial
  var carSuperpos = new ol.layer.Vector({
    source: new ol.source.Vector(),
    map: mapa,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: hex2rgba(bresalte, opr),
        width: 1
      }),
      fill: new ol.style.Fill({
        color: hex2rgba(aresalte, opr) 
      })
    }),
    zIndex: 3
  });

  // variable para resaltado en el pintado del mapa vectorial
  var resaltado; 
  // Variable para la inforrmación de características del mapa vectorial (clave entidad, nombre)
  var infoMapaVec = function(pixel) {

    capaGeoJSON.getFeatures(pixel).then(function(features)  {

      var feature = features.length ? features[0] : undefined;
      let tot_posmun = 0;
      let tot_nvosposmun = 0;
      let tot_nvosdefmun = 0;
      let pobmun = 0;
      let colorbanda = '';
      if (features.length) {
        for (i = 0; i< data.alcance.length; i++)
          if(feature.get(claveid[0])/1 == dato['edo_id'][i] && feature.get(claveid[1])/1 == dato['mun_id'][i]){  
            pobmun = dato['pobmun'][i];
            tot_posmun = dato['tot_posmun'][i];
            tot_actvvivmun = Number(dato['tot_actvvivmun'][i]).toLocaleString('es-MX');
            nvosactvvivmun = Number(Math.abs(dato['nvosactvvivmun'][i])).toLocaleString('es-MX');
            tot_actvdefmun = Number(dato['tot_actvdefmun'][i]).toLocaleString('es-MX');
            nvosactvdefmun = Number(Math.abs(dato['nvosactvdefmun'][i])).toLocaleString('es-MX');
            tot_nvosposmun = Number(Math.abs(dato['tot_nvosposmun'][i])).toLocaleString('es-MX');
            tot_nvosdefmun = Number(Math.abs(dato['tot_nvosdefmun'][i])).toLocaleString('es-MX');
            tot_sosmun = Number(dato['tot_sosmun'][i]).toLocaleString('es-MX');
            tot_defmun = dato['tot_defmun'][i];
            colorbanda = dato['color'][i];
            if(dato['nvosactvvivmun'][i] != 0)
              cadnvomunviv = dato['nvosactvvivmun'][i] >= 0 ? ' más' : ' menos';
            else
              cadnvomunviv = '';
            if(dato['nvosactvdefmun'][i] != 0)
              cadnvomundef = dato['nvosactvdefmun'][i] >= 0 ? ' más' : ' menos';
            else
              cadnvomundef = '';
          }
          let nomedo = '';
          let pobedo = 0;
          let nommun ='';
          let idcad = feature.get(claveid[0]).toString() + feature.get(claveid[1]).toString();
          if(feature.get('NOMGEO') != undefined) {
            nomedo = aentidades[feature.get('CVE_ENT')/1];
            pobedo = aentpob[feature.get('CVE_ENT')/1];
            nommun = feature.get('NOMGEO');       
        }
        let ient = feature.get('CVE_ENT')/1;
        if(anvoentactv_viv[ient] != 0)
          cadnvoedoviv = anvoentactv_viv[ient] >= 0 ? ' más' : ' menos';
        else
          cadnvoedoviv = '';
        if(anvoentactv_def[ient] != 0)
          cadnvoedodef = anvoentactv_def[ient] >= 0 ? ' más' : ' menos';
        else
          cadnvoedodef = ''; 

        let pobmuncad = pobmun != 0 ? "- - Población: " + new Number(pobmun).toLocaleString('es-MX') : "";
                                                /*************** Bloque de estado**********************/
          contenido.innerHTML = `<div class="edocl"><span class="entidadcl">${nomedo}</span></span><span class="entidadiddcl">ID: ${feature.get('CVE_ENT')} - - Población: ${ new Number(pobedo).toLocaleString('es-MX')}</span><br>
                                  <span class="entidaddcl">·Confirmados: ${ new Number(aentpos[ient]).toLocaleString('es-MX')} - [${ new Number(anvosentpos[ient]).toLocaleString('es-MX')} nuevos]</span></br>
                                  <span class="entidaddcl">·Mujeres: ${ new Number(aentmuj[ient]).toLocaleString('es-MX')}  (${ new Number((100 * aentmuj[ient]/aentpos[ient]).toFixed(1)).toLocaleString('es-MX')}%)</span></br>
                                  <span class="entidaddcl">·Hombres: ${ new Number(aenthom[ient]).toLocaleString('es-MX')}  (${ new Number((100 * aenthom[ient]/aentpos[ient]).toFixed(1)).toLocaleString('es-MX')}%)</span></br>
                                  <span class="entidaddcl">·Defunciones: ${ new Number(aentdef[ient]).toLocaleString('es-MX')} - [${ new Number(anvosentdef[ient]).toLocaleString('es-MX')} nuevos] - IL: ${(100 * aentdef[ient] / aentpos[ient]).toFixed(1)}%</span></br>
                                  <span class="entidaddcl viruscl">·(-14d) Activos vivos: ${ new Number(aentactv_viv[ient]).toLocaleString('es-MX')} 
                                  (${ new Number(Math.abs(anvoentactv_viv[ient])).toLocaleString('es-MX') + cadnvoedoviv}) <i class="fas fa-biohazard"></i></span></br>
                                  <span class="entidaddcl viruscl">·(-14d) Activos muertos: ${ new Number(aentactv_def[ient]).toLocaleString('es-MX')}
                                  (${ new Number(Math.abs(anvoentactv_def[ient])).toLocaleString('es-MX') + cadnvoedodef}) <i class="fas fa-biohazard"></i></span></br>
                                  <span class="entidaddcl">·Sospechosos: ${ new Number(aentsos[ient]).toLocaleString('es-MX')}</span></div><hr>`;

                                                /*****************Bloque de municipio ********************/
          contenido.innerHTML += `<span class="municipiocl">${nommun} </span><span class="entidadiddcl">ID: ${idcad} ${pobmuncad}</span><br>`;

          if(datosentmun[idcad] != 'undefined' && datosentmun[idcad] != undefined) {

            cadtotnvopos = parseInt(tot_nvosposmun) >= 0 ? ' nuevos' : ' menos';            
            cadtotnvodef = parseInt(tot_nvosdefmun) >= 0 ? ' nuevos' : ' menos';
            contenido.innerHTML += `<span class="entidaddcl">·Confirmados: ${new Number(tot_posmun).toLocaleString('es-MX')} - [${tot_nvosposmun + cadtotnvopos}]</span></br>`;
            contenido.innerHTML += `<span class="entidaddcl">·Defunciones: ${new Number(tot_defmun).toLocaleString('es-MX')} - IL: ${(100 * tot_defmun / tot_posmun).toFixed(1)}%</span></br>`;    
            contenido.innerHTML += `<span class="entidaddcl viruscl">·(-14d) Activos vivos: ${tot_actvvivmun}
                                   (${nvosactvvivmun + cadnvomunviv}) <i class="fas fa-biohazard"></i></span><br>`;
            contenido.innerHTML += `<span class="entidaddcl viruscl">·(-14d) Activos muertos: ${tot_actvdefmun}
                                   (${nvosactvdefmun + cadnvomundef})<i class="fas fa-biohazard"></i></span><br>`;

            contenido.innerHTML += `<span class="entidaddcl">·Sospechosos: ${tot_sosmun}</span<br>`;
            contenedor.style.borderLeft = `15px solid ${colorbanda}`;
            // contenido.innerHTML += `<p>Clave completa: ${ new Number(idcad}</p>`;  
  


  /******************* Construcción de la minitabla por sexo **********************/
            if(document.getElementById('sexoid').checked) {
              contenidotabla.innerHTML = `<div class="divTableHeading">
                                    <div class="divTableRow">
                                    <div class="divTableHead">Tratamiento</div>
                                    <div class="divTableHead">Sexo</div>
                                    <div class="divTableHead" style="text-align: right;">Confirmados</div>
                                    <div class="divTableHead" style="text-align: right;">Defunciones</div>
                                    </div>
                                    </div>
                                    <div class="divTableBody">`;       
              for(i = 0; i < datosentmun[idcad].length; i++) {
                let lugar = datosentmun[idcad][i][3] == 1 ? "Casa" : "Hospital";
                let sexo = datosentmun[idcad][i][0] == 1 ? "Mujeres" : "Hombres";
                let cantsexopos = datosentmun[idcad][i][1];
                let cantnvospos = datosentmun[idcad][i][4];
                let cantsexodef = datosentmun[idcad][i][2];
                let cantnvosdef = datosentmun[idcad][i][5];
                cadnvopos = cantnvospos >= 0 ? ' nuevos' : ' menos';      
                cadnvodef = cantnvosdef >= 0 ? ' nuevos' : ' menos';   
                contenidotabla.innerHTML += `<div class="divTableRow">
                                        <div class="divTableCell">${lugar}</div>
                                        <div class="divTableCell">${sexo}</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(cantsexopos).toLocaleString('es-MX')} - [${ new Number(Math.abs(cantnvospos)).toLocaleString('es-MX') + cadnvopos}]</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(cantsexodef).toLocaleString('es-MX')} - [${ new Number(Math.abs(cantnvosdef)).toLocaleString('es-MX') + cadnvodef}]</div>
                                        </div>`;                            
              } // for

             contenidotabla.innerHTML +=`<div class="divTableFoot tableFootStyle">
                                        <div class="divTableRow">
                                        <div class="divTableCell">&nbsp;</div>
                                        <div class="divTableCell">Totales</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(tot_posmun).toLocaleString('es-MX')} - [${new Number(Math.abs(tot_nvosposmun)).toLocaleString('es-MX') + cadtotnvopos}]</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(tot_defmun).toLocaleString('es-MX')} - [${new Number(Math.abs(tot_nvosdefmun)).toLocaleString('es-MX') + cadtotnvodef}]</div>
                                        </div>
                                        </div>`;
              contenidotabla.innerHTML += "</div>";
            } else { /******************* Construcción de la minitabla por edades **********************/
              let cadrangos = [' Hasta 13', '14 a 19', '20 a 29', '30 a 39', '40 a 49', '50 a 59', '60 a más'];
              contenidotabla.innerHTML = `<div class="divTableHeading">
                                  <div class="divTableRow">
                                  <div class="divTableHead">Rango edad</div>
                                  <div class="divTableHead" style="text-align: right;">Confirmados</div>
                                  <div class="divTableHead" style="text-align: right;">Defunciones</div>
                                  </div>
                                  </div>
                                  <div class="divTableBody">`;  

                for(i = 0; i < cadrangos.length; i++) {
                  contenidotabla.innerHTML += `<div class="divTableRow">
                                          <div class="divTableCell">${cadrangos[i]}</div>
                                          <div class="divTableCell" style="text-align: right;">${new Number(datosentmuneda[idcad][0][i * 4]).toLocaleString('es-MX')} - 
                                          [${ new Number(Math.abs(datosentmuneda[idcad][0][(i * 4) + 1])).toLocaleString('es-MX') + (datosentmuneda[idcad][0][(i * 4) + 1] >= 0 ? ' nuevos' : 'menos')}]</div>
                                          <div class="divTableCell" style="text-align: right;">${new Number(datosentmuneda[idcad][0][(i * 4) + 2]).toLocaleString('es-MX')} - 
                                          [${ new Number(Math.abs(datosentmuneda[idcad][0][(i * 4) + 3])).toLocaleString('es-MX') + (datosentmuneda[idcad][0][(i * 4) + 3] >= 0 ? ' nuevos' : 'menos')}]</div>
                                          </div>`;                            
                } // for cadrangos

             contenidotabla.innerHTML +=`<div class="divTableFoot tableFootStyle">
                                        <div class="divTableRow">
                                        <div class="divTableCell">Totales</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(datosentmuneda[idcad][0][28]).toLocaleString('es-MX')} - 
                                        [${new Number(Math.abs(datosentmuneda[idcad][0][29])).toLocaleString('es-MX') + (datosentmuneda[idcad][0][29] >= 0 ? ' nuevos' : 'menos')}]</div>
                                        <div class="divTableCell" style="text-align: right;">${ new Number(datosentmuneda[idcad][0][30]).toLocaleString('es-MX')} - 
                                        [${new Number(Math.abs(datosentmuneda[idcad][0][31])).toLocaleString('es-MX') + (datosentmuneda[idcad][0][31] >= 0 ? ' nuevos' : 'menos')}]</div>
                                        </div>
                                        </div>`;
              contenidotabla.innerHTML += "</div>";              

            }



          } else { // if(datosentmun[idcad]
            contenedor.style.borderLeft = `15px solid #FFFFFF`;
             contenidotabla.innerHTML = "";
          } 

      } 
      /*** Eliminando el canvas basura que se crean al pasar el cursor sobre el mapa **/
      let acanvas = document.getElementsByTagName('canvas');
      for (i =0; i< acanvas.length; i++) {
          if(acanvas[i].parentNode.className != "ol-layer") {
            acanvas[i].parentNode.removeChild(acanvas[i]);
          }
      }
    });

  };

  // Accón cuando el mouse se mueve sobre el mapa
  mapa.on('pointermove', function(evt) {
              if (evt.dragging) {
                return;
              }
    var pixel = mapa.getEventPixel(evt.originalEvent);

              var hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                  return true;
              }); 

              if(hit) {       
                  let espxt = 22; // Espacio extra entre cursor y tooltip
                  // this.getTarget().style.cursor = 'pointer';
                  var pixel = mapa.getEventPixel(evt.originalEvent);
                  let mapacanvas = document.getElementById("mapaid");
                  mapacanvas.style.cursor = 'crosshair';

                  let anchotp = contenedor.offsetWidth;
                  let altotp = contenedor.offsetHeight;

                  if((pixel[0] + anchotp + espxt) >= mapacanvas.offsetWidth ) {
                    contenedor.style.left = -(anchotp + 5 + espxt) +'px';
                  } else {
                    contenedor.style.left = 5 + espxt + 'px';
                  }
                  if(pixel[1] < altotp + 10  && pixel[1] + altotp + 10 <= mapacanvas.offsetHeight) {
                    contenedor.style.bottom = -(altotp + 10) + 'px';                    
                  } else {
                    contenedor.style.bottom = '10px';
                  }
                  if(pixel[1] < altotp + 10 && pixel[1] + altotp + 10 > mapacanvas.offsetHeight) {
                    if(pixel[0] + anchotp + espxt > mapacanvas.offsetWidth ) {
                      contenedor.style.left = -(anchotp + 8 + espxt) +'px';
                    } else {
                      contenedor.style.left = 8 + espxt + 'px';
                    }
                    contenedor.style.bottom =  -(altotp/2 + 10) + 'px';   
                  }

                  contenedor.style.visibility = 'visible';
                  contenido.style.visibility = 'visible';
                  infoMapaVec(pixel);
                  var coordenada = evt.coordinate;
                  overlay.setPosition(coordenada); 
                } else {
                  
                  desapareceTooltip(contenedor, contenido);
              //  this.getTarget().style.cursor = '';
                  // contenedor.style.cursor = '';
                  // contenedor.style.visibility = 'hidden';
                  // contenido.style.visibility = 'hidden';
                }
          });
  geojsoncorly = capaGeoJSON;
  mapa.addOverlay(overlay); 
  mapa.addLayer(geojsoncorly);


} // agregaMapaCoropletico



/**
 * Método de escucha del evento de el objeto tipo mapa. Aquí se decide qué tipo de capa de mapa se va 
 * a construir, si mapa de clusters o mapa de unidades simples.
 * @param  {object} evt El objeto de eventos del objeto mapa
 */
function alMover(evt) {
  vista = mapa.getView();
  zoomnvo = vista.getZoom();
  if(zoomnvo < 6.9) {
    estilonvo =  new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: hex2rgba(colorfrontera, 0.9), // magenta
                            // color: hex2rgba('#0057D9', 0.9), // convirtiendo a formato rgba azul
                            width: 0.4
                        })
                    });
    mapa.getLayers().R[2].setStyle(estilonvo);
  } else {
    estilonvo =  new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: hex2rgba(colorfrontera, 0.9), // magenta
                            // color: hex2rgba('#0057D9', 0.9), // convirtiendo a formato rgba azul
                            width: 2
                        })
                    });
    mapa.getLayers().R[2].setStyle(estilonvo);      
    }
    /*** Eliminando el canvas basura que se crean al pasar el cursor sobre el mapa **/
    let acanvas = document.getElementsByTagName('canvas');
    for (i =0; i< acanvas.length; i++) {
        if(acanvas[i].parentNode.className != "ol-layer") {
          acanvas[i].parentNode.removeChild(acanvas[i]);
        }
    }
  
}



/**
 * Función que obtiene el objeto tipo select para su interacción posterior de eventos
 * @param  {Layer} capa Parámetro que contiene el objeto tipo Layer que corresponde a la capa creada a mostrar sobre el mapa
 * @return {Select}      Se regresa el objeto tipo Select ya construido
 */
function obtenSelect(capa, tipocapa) {
  let fcolor = "#FFFFFF";
  let scolor = "#888888";
  let opr = 0.35;

  let estiloResaltado = new ol.style.Style({
                fill: new ol.style.Fill({
                        color: hex2rgba(fcolor, opr)
                      }),
                stroke: new ol.style.Stroke({
                        color: hex2rgba(scolor, opr),
                        width: 1
                      })
              });

  let select = new ol.interaction.Select({
                    layers: [capa],
                    condition: ol.events.condition.pointerMove,
                    style: estiloResaltado
                });
  return select;
}


/**
 * Función encargada de desaparecer el tooltip según las condiciones
 * @param  {Object} contenedor El div contenedor del tooltip
 * @param  {Object} contenido  El contenido del div del contenedor
 * @return {}            
 */
function desapareceTooltip(contenedor, contenido) {
  if(contenedor != null) {
    contenedor.style.cursor = '';
    contenedor.style.visibility = 'hidden';
    contenido.style.visibility = 'hidden';
  }
}


/**
 * Función convertidora de formato hexadecimal a formato rgba
 * @param  {String} hex La cadena de color hexadecimal del formato #AAAAAA
 * @param  {float}  op  [Valor de opacidad para esta capa]
 * @return {String}     [Regresa una cadena del formato: rgba(x, x, x, x.x) ]
 */
function hex2rgba(hex, op){
  var c;
  if (hex == null)
    hex = "#FF0000"; // color rojo por default
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+op+')';
  }
  throw new Error('Mal hexadecimal');
}


// function actualizaInfo() {
//   var el = document.getElementById('infoid');
//   el.innerHTML = startDate.toISOString();
// }

// function setTime() {
//   startDate.setMinutes(startDate.getMinutes() + 15);
//   if (startDate > new Date()) {
//     startDate = threeHoursAgo();
//   }
//   // layers[1].getSource().updateParams({'TIME': startDate.toISOString()}); // Esta isntruccion actualiza el layer
//   actualizaInfo();
// }


// var para = function() {
//   if (animationId !== null) {
//     window.clearInterval(animationId);
//     animationId = null;
//   }
// };

// var inicia = function() {
//   para();
//   if(layers != undefined)
//     animationId = window.setInterval(setTime, 1000 / frameRate);
// };

// var botonInicia = document.getElementById('iniciaid');
// botonInicia.addEventListener('click', inicia, false);

// var botonPara = document.getElementById('paraid');
// botonPara.addEventListener('click', para, false);

// actualizaInfo();


elselect = document.getElementById('volar-a-id');
elselect.addEventListener('change', (event) => {
  entcoord = ol.proj.fromLonLat(data_ents[event.target.value].centro);
  zent = data_ents[event.target.value].zoom;
  volarA(entcoord, function() {});
  

});

elselectfecha = document.getElementById('fechaid');
elselectfecha.addEventListener('change', (event) => {
  if(elselectfecha.value != "#")
    location.replace(elselectfecha.value + ".html");
});


/**
 * Función que realiza una animación de paneo y zoom para colocar la vista del mapa en otra región
 * @param  {array} localizacion La posición del centro de la región objetivo
 * @param  {object} hecho        [description]
 */
function volarA(localizacion, hecho) {
  var duracion = 2000;
  var zoom = zent;
  var parts = 2;
  var called = false;
  function callback(completado) {
    --parts;
    if (called) {
      return;
    }
    if (parts === 0 || !completado) {
      called = true;
      hecho(completado);
    }
  }
  mapa.getView().animate({
    center: localizacion,
    duration: duracion
  }, callback);

  mapa.getView().animate({
    zoom: zoom - 1,
    duration: duracion / 2
  }, {
    zoom: zoom,
    duration: duracion / 2
  }, callback);

}

/**
 * función que obtiene una copia del div leyenda y le define atributos y estilos propios
 */
function muestraLeyenda(arangos, arangoscol) {
    let mapasec = document.getElementById("contenedor-ap-id"); // obteniendo el contenedor del svg al que se le agregará el div contenedor
    var anchocont = 100; // ancho del contenedor
    var altocont = 100;  // alto del conte"nedor
    var d0 = new Date('2020-01-13');
    var df = new Date(fechact); 
    let ndias = Math.floor((df - d0) / (1000 * 3600 * 24)) + 1;
    let dia = df.toLocaleString("es-MX", {weekday: "long", day: "numeric", month: "long", year: "numeric"});
    var titulotxt1 =  "COVID-19";
    var titulotxt2 = `Día: ${ndias} \n Fecha de actualización: \n ${dia}`;
    var subttxt1 = `·Confirmados: ${aentpos[0].toLocaleString('es-MX')} -- [ ${new Number(aentpos[0] - totposayer).toLocaleString('es-MX')} nuevos ]`;  

    var subttxt1a = `·(-14d) Activos Total: ${new Number(aentactv_viv[0] + aentactv_def[0]).toLocaleString('es-MX')}
                      Vivos: ${new Number(aentactv_viv[0]).toLocaleString('es-MX')} -- Muertos: ${new Number(aentactv_def[0]).toLocaleString('es-MX')}`;  
    var subttxt1b = `·Mujeres: ${new Number(aentmuj[0]).toLocaleString('es-MX')}   (${new Number((100 * aentmuj[0]/aentpos[0]).toFixed(1)).toLocaleString('es-MX')}%)`;  
    var subttxt1c = `·Hombres: ${new Number(aenthom[0]).toLocaleString('es-MX')}   (${new Number((100 * aenthom[0]/aentpos[0]).toFixed(1)).toLocaleString('es-MX')}%)`;
    var subttxt2 = `·Defunciones: ${new Number(aentdef[0]).toLocaleString('es-MX')} - [${new Number(aentdef[0] - totdefayer).toLocaleString('es-MX')} nuevos] - IL: ${ (100*aentdef[0]/aentpos[0]).toFixed(1)}%`;
    var subttxt2b = `·Ambulatorios: ${new Number(totaldefcasa).toLocaleString('es-MX')}  (${new Number((100 * totaldefcasa/aentdef[0]).toFixed(0)).toLocaleString('es-MX')}%)`;
    var subttxt2c = `·Hospitalizados: ${new Number(aentdef[0] - totaldefcasa).toLocaleString('es-MX')}  (${new Number((100 * (aentdef[0] - totaldefcasa)/aentdef[0]).toFixed(0)).toLocaleString('es-MX')}%)`;
    var subttxt3 = `·Sospechosos: ${new Number(aentsos[0]).toLocaleString('es-MX')}`;

    var margenizq = 60;  /// Calculando el margen izquierdo en proporcion al zoom del navegador
    var margensup = 60;  // Definiendo el margen superior del contenedor
    


      // ////////////// Aplicando estilos a contenedor, titulo1, subtitulo1 e indicadores //////////////
      // ////////////////////////////////////////////////////////////////////////////////////////////
      /* Contenedor */
      contenedor = document.createElement("div"); // creando el div contenedor de la leyenda y titulo1s
      contenedor.className = "leyendacl";
      // contenedor.style.marginTop = '300px';
      
      // /* Título1 */
      divtitulo1 = document.createElement('div');
      divtitulo1.className = "titulo1leycl";
      divtitulo1.innerText = titulotxt1;
      // /* Título2 */
      divtitulo2 = document.createElement('div');
      divtitulo2.className = "fechacl";
      divtitulo2.innerText = titulotxt2;


      /* Subtitulo 1 */
      divsubt1 = document.createElement('div');
      divsubt1.className = "subtitulo_1_leycl";
      divsubt1.innerText = subttxt1;
     

      /* Subtitulo a con icono */
      divsubt1a = document.createElement('div');
      divsubt1a.className = "subtitulo_1_leysxcl viruscl";
      divsubt1a.innerText = subttxt1a; 
      icono = document.createElement('i');
      icono.className = 'fas fa-biohazard';
      divsubt1a.appendChild(icono);
      /* Subtitulo 1b */
      divsubt1b = document.createElement('div');
      divsubt1b.className = "subtitulo_1_leysxcl";
      divsubt1b.innerText = subttxt1b;
      /* Subtitulo 1c */
      divsubt1c = document.createElement('div');
      divsubt1c.className = "subtitulo_1_leysxcl";
      divsubt1c.innerText = subttxt1c;      
      /* Subtitulo 2 */
      divsubt2 = document.createElement('div');
      divsubt2.className = "subtitulo_1_leycl";
      divsubt2.innerText = subttxt2;
      /* Subtitulo 2b */
      divsubt2b = document.createElement('div');
      divsubt2b.className = "subtitulo_1_leysxcl";
      divsubt2b.innerText = subttxt2b;
      /* Subtitulo 2b */
      divsubt2c = document.createElement('div');
      divsubt2c.className = "subtitulo_1_leysxcl";
      divsubt2c.innerText = subttxt2c;      
      /* Subtitulo 3 */
      divsubt3 = document.createElement('div');
      divsubt3.className = "subtitulo_1_leycl";
      divsubt3.innerText = subttxt3;

      /* Indicadores de leyenda */
      divindics = document.createElement('p');
      divindics.className = "indicadorescl";    

      pitem = document.createElement('p');
      pitem.className = "rangocl";
      divitem = document.createElement('div');
      divitem.className = "cuadritocl";
      divitem.style.background = strgba;
      divetiq = document.createElement('div');
      divetiq.className = "etiq_cuadritocl";       
      divetiq.innerText = "Sin casos confirmados";
      pitem.appendChild(divitem);
      pitem.appendChild(divetiq);
      divindics.appendChild(pitem);

      pitem = document.createElement('p');
      pitem.className = "rangocl";
      divitem = document.createElement('div');
      divitem.className = "cuadritocl";
      divitem.style.background = colnoactv;
      divetiq = document.createElement('div');
      divetiq.className = "etiq_cuadritocl";       
      divetiq.innerText = "Con casos confirmados pero ya sin activos";
      pitem.appendChild(divitem);
      pitem.appendChild(divetiq);
      divindics.appendChild(pitem);

      for(i=0; i < arangos.length ; i++) {
        pitem = document.createElement('p');
        pitem.className = "rangocl";
        divitem = document.createElement('div');
        divitem.className = "cuadritocl";
        divitem.style.background = arangoscol[i];
        divetiq = document.createElement('div');
        divetiq.className = "etiq_cuadritocl";       
        divetiq.innerText = estableceRangosCad(i);
        pitem.appendChild(divitem);
        pitem.appendChild(divetiq);
        divindics.appendChild(pitem);
      } // for


      // Agregando por orden al div de titulo, subtitulo y el clon de leyenda al elemento padre contenedor, que a su vez 
      // será  agregado al elemento padre que es mapa ////
      contenedor.appendChild(divtitulo1);
      contenedor.appendChild(divtitulo2);
      divsubt1.appendChild(divsubt1a);
      divsubt1.appendChild(divsubt1b);
      divsubt1.appendChild(divsubt1c);
      divsubt2.appendChild(divsubt2b);
      divsubt2.appendChild(divsubt2c);
      contenedor.appendChild(divsubt1);
      contenedor.appendChild(divsubt2);
      contenedor.appendChild(divsubt3);
      contenedor.appendChild(divindics);
      mapasec.appendChild(contenedor);

}


function estableceRangosCad(i) {

  if(i == 0)
    return `De 1 a ${Math.floor(arangos[i])} activos`;
  else {
    if(i <= arangos.length - 2)
      return `De ${Math.floor(arangos[i-1]) + 1} a ${Math.floor(arangos[i])} activos`;
    else
      return `De ${Math.floor(arangos[i-1]) + 1} a más activos`;
  }
}