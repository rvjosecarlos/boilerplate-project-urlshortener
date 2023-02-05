const { MONGODB } = require('dotenv').config().parsed;
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require( 'body-parser' );
const dns = require( 'node:dns' );
const cors = require('cors');
const app = express();

// Para recibir parametros de un formulario
app.use( bodyParser.urlencoded( { extended: true } ) );

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  
  const { url } = req.body;
  const objError = { error: 'invalid url' };

  const nuevaURL = url.replace( /(https:\/\/)|(http:\/\/)/, "" );
  
  // Evalua que se pueda obtener la direccion IP de la url proporcionada, si no es posible entonces no es url valida
  dns.lookup( nuevaURL, ( error, ip )=>{
    if(error){
      res.json( objError );
      return;
    }
    agregarURL( url, res );
  } );

});

// Manejador de solicitudes de paginas ya acortadas
app.get( '/api/shorturl/:pagina', paginaAcortada );

// Middleware del manejador que retorna la pagina web
async function paginaAcortada( req, res ){

  // Numero de pagina consultada
  const { pagina } = req.params;

  // Busca en la BD, si existe redirige al usuario, si no envia un JSON con un mensaje de error
  const existeURL = await URLSCortas.findOne( { short_url: pagina } );

  if(existeURL){
    console.log(existeURL);
    const { original_url } = existeURL;
    res.redirect( original_url );
    
    return;
  }

  res.json( {"error":"No short URL found for the given input"} );

}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


// BASE DE DATOS MONGODB
mongoose.connect( MONGODB, { useNewUrlParser: true, useUnifiedTopology: true } );

// Define el esquema de los documentos que se almacenaran
const esquemaURL = new mongoose.Schema( {
  original_url : {
    type: String
  }, 
  short_url : {
    type: Number
  }
});

// Define el modelo con el esquema que sera la coleccion de documentos
const URLSCortas = mongoose.model( 'urls', esquemaURL );

// Consulta el numero total de documentos
async function totalDocumentos(){

  return await URLSCortas.count();

}

async function buscarDocumento( url ){
  
  return await URLSCortas.findOne( { original_url: url } );

}

// Inserta los objetos en la BD
async function agregarURL( url, res ){

  const existeURL = await buscarDocumento( url );

  if(!existeURL){
    console.log('NO EXISTE; SE AGREGARA')
    const objURL = {
      original_url: url,
      short_url: await totalDocumentos()+1
    }
      
    await URLSCortas.create( objURL );
    res.json( objURL );
    return;
  }

  res.json( { original_url: existeURL.original_url, short_url: existeURL.short_url } ); 
  console.log('YA EXISTE ES:',existeURL);

}