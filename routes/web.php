<?php

use App\Http\Controllers\loginController;
use App\Http\Middleware\redirectByRole;
use Illuminate\Support\Facades\Route;

// Rutas de Login
Route::get('/login', [loginController::class , 'index'])->name('login');
Route::post('/login', [loginController::class , 'login'])->name('login.post');

// Ruta del Monitor (Solo con auth)
Route::get('/', function () {
    return view('welcome');
})->middleware('auth')->name('monitor');

Route::post('/logout', [loginController::class , 'logout'])->name('logout');