const Alexa = require('ask-sdk');

const LaunchHandler = {
  canHandle(handlerInput) {
    console.log("LaunchHandler - canHandle:" + JSON.stringify(handlerInput));
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    console.log("LaunchHandler:" + JSON.stringify(handlerInput));
    const speechOutput = HELP_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(SKILL_NAME, speechOutput)
      .getResponse();
  },
};

const QueTiempoHaraHandler = {
  canHandle(handlerInput) {
    console.log("QueTiempoHaraHandler - canHandle:" + JSON.stringify(handlerInput));
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'IntentRequest'
        && request.intent.name === 'QueTiempoHaraIntent');
  },
  handle(handlerInput) {
    console.log("QueTiempoHaraHandler - handle:" + JSON.stringify(handlerInput));
    return prediceTiempo(handlerInput)
      .then((alexaResponse) => {
      return alexaResponse;
    });
  },
};


function prediceTiempo(handlerInput){
  return new Promise((resolve, reject) => {
    const request = handlerInput.requestEnvelope.request;
    const lugar = request.intent.slots.lugar.value;
    const cuando = request.intent.slots.cuando.value;
    const metrica = request.intent.slots.metrica.value;
    console.log("Recuperando información sobre " + metrica + " para " + lugar + " el dia " + cuando);
	  getWeatherPrediction(lugar, function callback(error, data) {
	    console.log("getWeatherPrediction error: " + error);
	    console.log("getWeatherPrediction data; " + data);
	    let respuestaAEMET = JSON.parse(data).datos;
      if (respuestaAEMET) {
        console.log("QueTiempoHaraHandler - resultado: " + respuestaAEMET);

        getAEMETData(respuestaAEMET, function callback(error, data) {
    	    console.log("getAEMETData error: " + error);
    	    console.log("getAEMETData data: " + data);
          let respuestaAEMET2 = JSON.parse(data);
          let prediccionDia;
          if (cuando) {
            prediccionDia = respuestaAEMET2[0].prediccion.dia.find((it) => {
              console.log("DIA: " + JSON.stringify(it));
              return it.fecha === cuando;
            });
            console.log("Fecha encontrada: " + JSON.stringify(prediccionDia));
          } else {
            prediccionDia = respuestaAEMET2[0].prediccion.dia[0];
            console.log("Fecha encontrada para hoy, la primera: " + JSON.stringify(prediccionDia));
          }

          let speechOutput = "La temperatura máxima esperada para " + lugar;
          if (cuando) {
            speechOutput+= " el " + prediccionDia.fecha; 
          } else {
          speechOutput+= " hoy " + prediccionDia.fecha;
          }
          speechOutput+= " es de " + prediccionDia.temperatura.maxima + " y la mínima de ";
          speechOutput+= prediccionDia.temperatura.minima + " grados Celsius. Información obtenida de la Agencia Estatal de Meteorología";
          console.log("Respuesta: " + speechOutput);
          
          const alexaResponse = handlerInput.responseBuilder
            .speak("" + speechOutput)
            .withSimpleCard(SKILL_NAME, "" + speechOutput)
            .getResponse();
          console.log("alexaResponse:" + JSON.stringify(alexaResponse));
          resolve(alexaResponse);
        });
      
      } else {
        console.log("QueTiempoHaraHandler - no data: " + respuestaAEMET);
        var speechOutput = "Lo siento, no he conseguido obtener información sobre tu petición";
        var alexaResponse = handlerInput.responseBuilder
          .speak("" + speechOutput)
          .withSimpleCard(SKILL_NAME, "" + speechOutput)
          .getResponse();
      
        console.log("alexaResponse:" + JSON.stringify(alexaResponse));
        resolve(alexaResponse);
      }
	  }
    );    
  })
}

function getWeatherPrediction(lugar, callback) {
  var http = require("https");
  const aemetAPIkey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJnYXJjaWEucGF1QGdtYWlsLmNvbSIsImp0aSI6ImFmYjZkMDJjLWNlMjAtNDc1ZC05NWUwLTZkYTlhMmE1OGI2MiIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNTM4MzA2NTE1LCJ1c2VySWQiOiJhZmI2ZDAyYy1jZTIwLTQ3NWQtOTVlMC02ZGE5YTJhNThiNjIiLCJyb2xlIjoiIn0.Tojcxw5lAUTSsR7_KvCP211uacIkAVVGTLNI4a-Sax8";
  const codLugar = ciudades[lugar];
  const resource = "/opendata/api/prediccion/especifica/municipio/diaria/" + codLugar;
  console.log("Llamando a la API: " + resource);
  var options = {
    "method": "GET",
    "hostname": "opendata.aemet.es",
    "path": resource + "?api_key=" + aemetAPIkey,
    "headers": {
      "cache-control": "no-cache"
    }
  };
  var req = http.request(options, function (res) {
    var chunks = [];
  
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function () {
      var body = Buffer.concat(chunks);
      const response = body.toString();
      console.log("AEMETresponse 1 is: " + response);
      callback(null, response);
    });
  });
  
  req.end();
};

function getAEMETData(resource, callback) {
  var http = require("https");
  const aemetAPIkey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJnYXJjaWEucGF1QGdtYWlsLmNvbSIsImp0aSI6ImFmYjZkMDJjLWNlMjAtNDc1ZC05NWUwLTZkYTlhMmE1OGI2MiIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNTM4MzA2NTE1LCJ1c2VySWQiOiJhZmI2ZDAyYy1jZTIwLTQ3NWQtOTVlMC02ZGE5YTJhNThiNjIiLCJyb2xlIjoiIn0.Tojcxw5lAUTSsR7_KvCP211uacIkAVVGTLNI4a-Sax8";
  var options = {
    "method": "GET",
    "hostname": "opendata.aemet.es",
    "path": resource + "?api_key=" + aemetAPIkey,
    "headers": {
      "cache-control": "no-cache"
    }
  };
  var req = http.request(options, function (res) {
    var chunks = [];
  
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function () {
      var body = Buffer.concat(chunks);
      const AEMETresponse = body.toString();
      console.log("AEMETresponse 2 is: " + AEMETresponse);
      callback(null, AEMETresponse);
    });
  });
  
  req.end();
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Esto... Aqui pasó algo malo.')
      .reprompt('Esto... Aqui pasó algo malo.')
      .getResponse();
  },
};

const SKILL_NAME = 'el tiempo';
const GET_FACT_MESSAGE = 'Aqui está tu resultado: ';
const HELP_MESSAGE = 'Hola! Puedes preguntarme qué tiempo hará o qué tiempo hace. Puedes decir: Alexa, abre el oráculo del tiempo y pregúntale qué temperatura hará mañana en barcelona. Información obtenida de la Agencia Estatal de Meteorología';
const HELP_REPROMPT = 'En qué te puedo ayudar?';
const STOP_MESSAGE = 'Que tengas un buen dia!';

const ciudades = {};
ciudades["abrera"] = '08001';
ciudades["aguilar de segarra"] = '08002';
ciudades["aiguafreda"] = '08014';
ciudades["alella"] = '08003';
ciudades["alpens"] = '08004';
ciudades["ametlla del vallès, l'"] = '08005';
ciudades["arenys de mar"] = '08006';
ciudades["arenys de munt"] = '08007';
ciudades["argençola"] = '08008';
ciudades["argentona"] = '08009';
ciudades["artés"] = '08010';
ciudades["avià"] = '08011';
ciudades["avinyó"] = '08012';
ciudades["avinyonet del penedès"] = '08013';
ciudades["badalona"] = '08015';
ciudades["badia del vallès"] = '08904';
ciudades["bagà"] = '08016';
ciudades["balenyà"] = '08017';
ciudades["balsareny"] = '08018';
ciudades["barberà del vallès"] = '08252';
ciudades["barcelona"] = '08019';
ciudades["begues"] = '08020';
ciudades["bellprat"] = '08021';
ciudades["berga"] = '08022';
ciudades["bigues i riells"] = '08023';
ciudades["borredà"] = '08024';
ciudades["bruc, el"] = '08025';
ciudades["brull, el"] = '08026';
ciudades["cabanyes, les"] = '08027';
ciudades["cabrera d'anoia"] = '08028';
ciudades["cabrera de mar"] = '08029';
ciudades["cabrils"] = '08030';
ciudades["calaf"] = '08031';
ciudades["calders"] = '08034';
ciudades["caldes de montbui"] = '08033';
ciudades["caldes d'estrac"] = '08032';
ciudades["calella"] = '08035';
ciudades["calldetenes"] = '08037';
ciudades["callús"] = '08038';
ciudades["calonge de segarra"] = '08036';
ciudades["campins"] = '08039';
ciudades["canet de mar"] = '08040';
ciudades["canovelles"] = '08041';
ciudades["cànoves i samalús"] = '08042';
ciudades["canyelles"] = '08043';
ciudades["capellades"] = '08044';
ciudades["capolat"] = '08045';
ciudades["cardedeu"] = '08046';
ciudades["cardona"] = '08047';
ciudades["carme"] = '08048';
ciudades["casserres"] = '08049';
ciudades["castell de l'areny"] = '08057';
ciudades["castellar de n'hug"] = '08052';
ciudades["castellar del riu"] = '08050';
ciudades["castellar del vallès"] = '08051';
ciudades["castellbell i el vilar"] = '08053';
ciudades["castellbisbal"] = '08054';
ciudades["castellcir"] = '08055';
ciudades["castelldefels"] = '08056';
ciudades["castellet i la gornal"] = '08058';
ciudades["castellfollit de riubregós"] = '08060';
ciudades["castellfollit del boix"] = '08059';
ciudades["castellgalí"] = '08061';
ciudades["castellnou de bages"] = '08062';
ciudades["castellolí"] = '08063';
ciudades["castellterçol"] = '08064';
ciudades["castellví de la marca"] = '08065';
ciudades["castellví de rosanes"] = '08066';
ciudades["centelles"] = '08067';
ciudades["cercs"] = '08268';
ciudades["cerdanyola del vallès"] = '08266';
ciudades["cervelló"] = '08068';
ciudades["collbató"] = '08069';
ciudades["collsuspina"] = '08070';
ciudades["copons"] = '08071';
ciudades["corbera de llobregat"] = '08072';
ciudades["cornellà de llobregat"] = '08073';
ciudades["cubelles"] = '08074';
ciudades["dosrius"] = '08075';
ciudades["esparreguera"] = '08076';
ciudades["esplugues de llobregat"] = '08077';
ciudades["espunyola, l'"] = '08078';
ciudades["esquirol, l'"] = '08254';
ciudades["estany, l'"] = '08079';
ciudades["figaró-montmany"] = '08134';
ciudades["fígols"] = '08080';
ciudades["fogars de la selva"] = '08082';
ciudades["fogars de montclús"] = '08081';
ciudades["folgueroles"] = '08083';
ciudades["fonollosa"] = '08084';
ciudades["font-rubí"] = '08085';
ciudades["franqueses del vallès, les"] = '08086';
ciudades["gaià"] = '08090';
ciudades["gallifa"] = '08087';
ciudades["garriga, la"] = '08088';
ciudades["gavà"] = '08089';
ciudades["gelida"] = '08091';
ciudades["gironella"] = '08092';
ciudades["gisclareny"] = '08093';
ciudades["granada, la"] = '08094';
ciudades["granera"] = '08095';
ciudades["granollers"] = '08096';
ciudades["gualba"] = '08097';
ciudades["guardiola de berguedà"] = '08099';
ciudades["gurb"] = '08100';
ciudades["hospitalet de llobregat, l'"] = '08101';
ciudades["hostalets de pierola, els"] = '08162';
ciudades["igualada"] = '08102';
ciudades["jorba"] = '08103';
ciudades["llacuna, la"] = '08104';
ciudades["llagosta, la"] = '08105';
ciudades["lliçà d'amunt"] = '08107';
ciudades["lliçà de vall"] = '08108';
ciudades["llinars del vallès"] = '08106';
ciudades["lluçà"] = '08109';
ciudades["malgrat de mar"] = '08110';
ciudades["malla"] = '08111';
ciudades["manlleu"] = '08112';
ciudades["manresa"] = '08113';
ciudades["marganell"] = '08242';
ciudades["martorell"] = '08114';
ciudades["martorelles"] = '08115';
ciudades["masies de roda, les"] = '08116';
ciudades["masies de voltregà, les"] = '08117';
ciudades["masnou, el"] = '08118';
ciudades["masquefa"] = '08119';
ciudades["matadepera"] = '08120';
ciudades["mataró"] = '08121';
ciudades["mediona"] = '08122';
ciudades["moià"] = '08138';
ciudades["molins de rei"] = '08123';
ciudades["mollet del vallès"] = '08124';
ciudades["monistrol de calders"] = '08128';
ciudades["monistrol de montserrat"] = '08127';
ciudades["montcada i reixac"] = '08125';
ciudades["montclar"] = '08130';
ciudades["montesquiu"] = '08131';
ciudades["montgat"] = '08126';
ciudades["montmajor"] = '08132';
ciudades["montmaneu"] = '08133';
ciudades["montmeló"] = '08135';
ciudades["montornès del vallès"] = '08136';
ciudades["montseny"] = '08137';
ciudades["muntanyola"] = '08129';
ciudades["mura"] = '08139';
ciudades["navarcles"] = '08140';
ciudades["navàs"] = '08141';
ciudades["nou de berguedà, la"] = '08142';
ciudades["òdena"] = '08143';
ciudades["olèrdola"] = '08145';
ciudades["olesa de bonesvalls"] = '08146';
ciudades["olesa de montserrat"] = '08147';
ciudades["olivella"] = '08148';
ciudades["olost"] = '08149';
ciudades["olvan"] = '08144';
ciudades["orís"] = '08150';
ciudades["oristà"] = '08151';
ciudades["orpí"] = '08152';
ciudades["òrrius"] = '08153';
ciudades["pacs del penedès"] = '08154';
ciudades["palafolls"] = '08155';
ciudades["palau-solità i plegamans"] = '08156';
ciudades["pallejà"] = '08157';
ciudades["palma de cervelló, la"] = '08905';
ciudades["papiol, el"] = '08158';
ciudades["parets del vallès"] = '08159';
ciudades["perafita"] = '08160';
ciudades["piera"] = '08161';
ciudades["pineda de mar"] = '08163';
ciudades["pla del penedès, el"] = '08164';
ciudades["pobla de claramunt, la"] = '08165';
ciudades["pobla de lillet, la"] = '08166';
ciudades["polinyà"] = '08167';
ciudades["pont de vilomara i rocafort, el"] = '08182';
ciudades["pontons"] = '08168';
ciudades["prat de llobregat, el"] = '08169';
ciudades["prats de lluçanès"] = '08171';
ciudades["prats de rei, els"] = '08170';
ciudades["premià de dalt"] = '08230';
ciudades["premià de mar"] = '08172';
ciudades["puigdàlber"] = '08174';
ciudades["puig-reig"] = '08175';
ciudades["pujalt"] = '08176';
ciudades["quar, la"] = '08177';
ciudades["rajadell"] = '08178';
ciudades["rellinars"] = '08179';
ciudades["ripollet"] = '08180';
ciudades["roca del vallès, la"] = '08181';
ciudades["roda de ter"] = '08183';
ciudades["rubí"] = '08184';
ciudades["rubió"] = '08185';
ciudades["rupit i pruit"] = '08901';
ciudades["sabadell"] = '08187';
ciudades["sagàs"] = '08188';
ciudades["saldes"] = '08190';
ciudades["sallent"] = '08191';
ciudades["sant adrià de besòs"] = '08194';
ciudades["sant agustí de lluçanès"] = '08195';
ciudades["sant andreu de la barca"] = '08196';
ciudades["sant andreu de llavaneres"] = '08197';
ciudades["sant antoni de vilamajor"] = '08198';
ciudades["sant bartomeu del grau"] = '08199';
ciudades["sant boi de llobregat"] = '08200';
ciudades["sant boi de lluçanès"] = '08201';
ciudades["sant cebrià de vallalta"] = '08203';
ciudades["sant celoni"] = '08202';
ciudades["sant climent de llobregat"] = '08204';
ciudades["sant cugat del vallès"] = '08205';
ciudades["sant cugat sesgarrigues"] = '08206';
ciudades["sant esteve de palautordera"] = '08207';
ciudades["sant esteve sesrovires"] = '08208';
ciudades["sant feliu de codines"] = '08210';
ciudades["sant feliu de llobregat"] = '08211';
ciudades["sant feliu sasserra"] = '08212';
ciudades["sant fost de campsentelles"] = '08209';
ciudades["sant fruitós de bages"] = '08213';
ciudades["sant hipòlit de voltregà"] = '08215';
ciudades["sant iscle de vallalta"] = '08193';
ciudades["sant jaume de frontanyà"] = '08216';
ciudades["sant joan de vilatorrada"] = '08218';
ciudades["sant joan despí"] = '08217';
ciudades["sant julià de cerdanyola"] = '08903';
ciudades["sant julià de vilatorta"] = '08220';
ciudades["sant just desvern"] = '08221';
ciudades["sant llorenç d'hortons"] = '08222';
ciudades["sant llorenç savall"] = '08223';
ciudades["sant martí d'albars"] = '08225';
ciudades["sant martí de centelles"] = '08224';
ciudades["sant martí de tous"] = '08226';
ciudades["sant martí sarroca"] = '08227';
ciudades["sant martí sesgueioles"] = '08228';
ciudades["sant mateu de bages"] = '08229';
ciudades["sant pere de ribes"] = '08231';
ciudades["sant pere de riudebitlles"] = '08232';
ciudades["sant pere de torelló"] = '08233';
ciudades["sant pere de vilamajor"] = '08234';
ciudades["sant pere sallavinera"] = '08189';
ciudades["sant pol de mar"] = '08235';
ciudades["sant quintí de mediona"] = '08236';
ciudades["sant quirze de besora"] = '08237';
ciudades["sant quirze del vallès"] = '08238';
ciudades["sant quirze safaja"] = '08239';
ciudades["sant sadurní d'anoia"] = '08240';
ciudades["sant sadurní d'osormort"] = '08241';
ciudades["sant salvador de guardiola"] = '08098';
ciudades["sant vicenç de castellet"] = '08262';
ciudades["sant vicenç de montalt"] = '08264';
ciudades["sant vicenç de torelló"] = '08265';
ciudades["sant vicenç dels horts"] = '08263';
ciudades["santa cecília de voltregà"] = '08243';
ciudades["santa coloma de cervelló"] = '08244';
ciudades["santa coloma de gramenet"] = '08245';
ciudades["santa eugènia de berga"] = '08246';
ciudades["santa eulàlia de riuprimer"] = '08247';
ciudades["santa eulàlia de ronçana"] = '08248';
ciudades["santa fe del penedès"] = '08249';
ciudades["santa margarida de montbui"] = '08250';
ciudades["santa margarida i els monjos"] = '08251';
ciudades["santa maria de besora"] = '08253';
ciudades["santa maria de martorelles"] = '08256';
ciudades["santa maria de merlès"] = '08255';
ciudades["santa maria de miralles"] = '08257';
ciudades["santa maria de palautordera"] = '08259';
ciudades["santa maria d'oló"] = '08258';
ciudades["santa perpètua de mogoda"] = '08260';
ciudades["santa susanna"] = '08261';
ciudades["santpedor"] = '08192';
ciudades["sentmenat"] = '08267';
ciudades["seva"] = '08269';
ciudades["sitges"] = '08270';
ciudades["sobremunt"] = '08271';
ciudades["sora"] = '08272';
ciudades["subirats"] = '08273';
ciudades["súria"] = '08274';
ciudades["tagamanent"] = '08276';
ciudades["talamanca"] = '08277';
ciudades["taradell"] = '08278';
ciudades["tavèrnoles"] = '08275';
ciudades["tavertet"] = '08280';
ciudades["teià"] = '08281';
ciudades["terrassa"] = '08279';
ciudades["tiana"] = '08282';
ciudades["tona"] = '08283';
ciudades["tordera"] = '08284';
ciudades["torelló"] = '08285';
ciudades["torre de claramunt, la"] = '08286';
ciudades["torrelavit"] = '08287';
ciudades["torrelles de foix"] = '08288';
ciudades["torrelles de llobregat"] = '08289';
ciudades["ullastrell"] = '08290';
ciudades["vacarisses"] = '08291';
ciudades["vallbona d'anoia"] = '08292';
ciudades["vallcebre"] = '08293';
ciudades["vallgorguina"] = '08294';
ciudades["vallirana"] = '08295';
ciudades["vallromanes"] = '08296';
ciudades["veciana"] = '08297';
ciudades["vic"] = '08298';
ciudades["vilada"] = '08299';
ciudades["viladecans"] = '08301';
ciudades["viladecavalls"] = '08300';
ciudades["vilafranca del penedès"] = '08305';
ciudades["vilalba sasserra"] = '08306';
ciudades["vilanova de sau"] = '08303';
ciudades["vilanova del camí"] = '08302';
ciudades["vilanova del vallès"] = '08902';
ciudades["vilanova i la geltrú"] = '08307';
ciudades["vilassar de dalt"] = '08214';
ciudades["vilassar de mar"] = '08219';
ciudades["vilobí del penedès"] = '08304';
ciudades["viver i serrateix"] = '08308';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchHandler,
    QueTiempoHaraHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
