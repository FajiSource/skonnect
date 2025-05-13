<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class YouthAuthController extends Controller
{
    /**
     * Email verification service
     * 
     * @var EmailVerificationService
     */
    protected $verificationService;
    
    /**
     * Constructor
     */
    public function __construct(EmailVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Handle youth user login requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Remove verification check - allow login regardless of verification status
        if (Auth::attempt($credentials, $request->boolean('rememberMe'))) {
            $request->session()->regenerate();
            
            return response()->json([
                'success' => true,
                'user' => Auth::user()
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }
    /**
     * Handle youth user logout requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        Auth::logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return response()->json(['success' => true]);
    }

    /**
     * Get the authenticated youth user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function user()
    {
        if (Auth::check()) {
            return response()->json([
                'authenticated' => true,
                'user' => Auth::user()
            ]);
        }
        
        return response()->json(['authenticated' => false]);
    }

    /**
     * Handle youth user registration requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female,rather not say',
            'dob' => 'required|date',
            'age' => 'required|integer|min:1',
            'email' => 'required|string|email|max:255|unique:accounts',
            'address' => 'required|string|max:255',
            'phone_number' => 'required|string|max:255',
            'baranggay' => 'required|in:Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = Account::create([
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'dob' => $request->dob,
            'age' => $request->age,
            'email' => $request->email,
            'address' => $request->address,
            'phone_number' => $request->phone_number,
            'baranggay' => $request->baranggay,
            'password' => Hash::make($request->password),
            'verification_status' => 'not_verified',
            'profile_status' => 'not_profiled',
        ]);

        // Generate OTP code
        $code = $this->verificationService->generateOtp($user->email, 'youth');
        
        // Send OTP email
        $this->verificationService->sendOtpEmail($user->email, $user->first_name, $code);

        return response()->json([
            'success' => true,
            'user' => $user,
            'needsVerification' => true
        ]);
    }
    
    /**
     * Verify OTP code for youth user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
            'code' => 'required|string|size:6',
        ]);
        
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'youth'
        );
        
        if ($isValid) {
            return response()->json([
                'success' => true,
                'message' => 'Your account has been verified successfully.'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code.',
            'isExpired' => $this->verificationService->isOtpExpired($request->email, 'youth')
        ], 400);
    }
    
    /**
     * Resend OTP code for youth user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
            'force' => 'sometimes|boolean',
        ]);
        
        $force = $request->input('force', false);
        $result = $this->verificationService->resendOtp($request->email, 'youth', $force);
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['is_new'] ? 
                    'Verification code has been sent to your email.' : 
                    'Your verification code is still valid.',
                'remaining_time' => $result['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to send verification code. Please try again later.'
        ], 500);
    }
    
    /**
     * Get the current OTP status and remaining time
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOtpStatus(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
        ]);
        
        $currentOtp = $this->verificationService->getCurrentOtp($request->email, 'youth');
        
        if ($currentOtp['exists']) {
            return response()->json([
                'success' => true,
                'has_active_otp' => $currentOtp['remaining_time'] > 0,
                'remaining_time' => $currentOtp['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => true,
            'has_active_otp' => false,
            'remaining_time' => 0
        ]);
    }
}