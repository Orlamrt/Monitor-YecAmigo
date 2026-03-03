<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth as FacadesAuth;

class loginController extends Controller
{
    public function index()
    {
        return view('login');
    }

  public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (FacadesAuth::attempt($credentials)) {
        $request->session()->regenerate();
        
        $user = FacadesAuth::user();
        $role = strtolower($user->role); // 'admin', 'policia', 'vialidad', etc.

        // Si es admin, lo mandamos a la raíz sin parámetros
        if ($role === 'admin') {
            return redirect()->intended(route('monitor'));
        }

        // Para los demás, inyectamos el parámetro 'area' de una vez
        return redirect()->route('monitor', ['area' => $role]);
    }

    return back()->withErrors([
        'email' => 'Las credenciales no coinciden con nuestros registros.',
    ])->onlyInput('email');
}
    public function logout(Request $request)
    {
        FacadesAuth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
