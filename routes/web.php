<?php

use App\Http\Controllers\loginController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [loginController::class , 'index'])->name('login');
Route::post('/login', [loginController::class , 'login'])->name('login.post');

Route::get('/', function () {return view('welcome');});

Route::get('/welcome', function (){return view('welcome');})->middleware('auth');