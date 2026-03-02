<?php

use App\Events\incidente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http as FacadesHttp;
use Illuminate\Support\Facades\Route;
use League\Uri\Http;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/webhook-n8n', function (Request $request) {
    $datos = $request->all();

    // Disparamos el evento de Laravel que viaja por WebSockets
    FacadesHttp::post('http://zenta.icu:3001/',$datos);

    return response()->json([
        'status' => 'Enviado']);
});
