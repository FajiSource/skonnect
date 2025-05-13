<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Skaccount;
use App\Models\AuthenticationLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SkAuthenticationController extends Controller
{
    /**
     * Get all pending SK users
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingUsers(Request $request)
    {
        try {
            // Check if user has permission (Federasyon or Chairman)
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Query to get users (removed verification requirement)
            $query = Skaccount::query();
            
            // If the user is a Chairman, only show Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $query->where('sk_station', $skUser->sk_station)
                      ->where('sk_role', 'Kagawad'); // Chairman can only see Kagawads
            } else {
                // Federasyon can see Chairmen and Kagawads, but not other Federasyon
                $query->whereIn('sk_role', ['Chairman', 'Kagawad']);
            }
            
            // If a specific barangay is requested, filter by that barangay
            if ($request->has('barangay') && $request->barangay !== 'All') {
                $query->where('sk_station', $request->barangay);
            }
            
            // Additional filters
            if ($request->has('role') && $request->role !== 'All') {
                $query->where('sk_role', $request->role);
            }
            
            // Add status filter
            if ($request->has('status')) {
                $query->where('authentication_status', $request->status);
            } else {
                // Default to showing not_active users for pending
                if ($request->input('view', 'pending') === 'pending') {
                    $query->where('authentication_status', 'not_active');
                } else {
                    $query->where('authentication_status', 'active');
                }
            }
            
            if ($request->has('date_range')) {
                $dates = explode(',', $request->date_range);
                if (count($dates) === 2) {
                    $query->whereBetween('created_at', [$dates[0], $dates[1]]);
                }
            }
            
            // Sort by most recent by default
            $sortBy = $request->input('sort_by', 'created_at');
            $sortDirection = $request->input('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);
            
            $users = $query->get();
            
            // Map the users to include file URLs
            $users = $users->map(function($user) {
                if ($user->valid_id) {
                    // The valid_id is stored as the path relative to storage/app/public
                    // We need to construct the public URL properly
                    $user->valid_id_url = asset('storage/' . $user->valid_id);
                    $user->valid_id_filename = basename($user->valid_id);
                    $user->valid_id_extension = pathinfo($user->valid_id, PATHINFO_EXTENSION);
                    
                    // Alternative: Check if file exists and provide full path
                    $fullPath = storage_path('app/public/' . $user->valid_id);
                    $user->valid_id_exists = file_exists($fullPath);
                }
                return $user;
            });
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get authentication statistics
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthStats(Request $request)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Base query - removed verification requirement
            $baseQuery = Skaccount::query();
            
            // If Chairman, restrict to Kagawads in their barangay
            if ($skUser->sk_role === 'Chairman') {
                $baseQuery->where('sk_station', $skUser->sk_station)
                          ->where('sk_role', 'Kagawad');
            } else {
                // Federasyon can see Chairmen and Kagawads
                $baseQuery->whereIn('sk_role', ['Chairman', 'Kagawad']);
            }
            
            // Count of non-authenticated users
            $pendingCount = (clone $baseQuery)
                ->where('authentication_status', 'not_active')
                ->count();
            
            // Count of authenticated users
            $authenticatedCount = (clone $baseQuery)
                ->where('authentication_status', 'active')
                ->count();
            
            // Recent authentications (last 7 days)
            $recentAuthentications = (clone $baseQuery)
                ->where('authentication_status', 'active')
                ->where('authenticated_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            // Barangay breakdown of pending users
            $barangayBreakdown = [];
            
            if ($skUser->sk_role === 'Federasyon') {
                $barangayBreakdown = (clone $baseQuery)
                    ->where('authentication_status', 'not_active')
                    ->select('sk_station')
                    ->selectRaw('count(*) as count')
                    ->groupBy('sk_station')
                    ->get()
                    ->pluck('count', 'sk_station')
                    ->toArray();
            }
            
            return response()->json([
                'success' => true,
                'stats' => [
                    'pending' => $pendingCount,
                    'authenticated' => $authenticatedCount,
                    'recent_authentications' => $recentAuthentications,
                    'barangay_breakdown' => $barangayBreakdown
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get authentication logs
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthLogs(Request $request)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Query for logs
            $query = AuthenticationLog::with(['authenticator', 'user'])
                ->orderBy('created_at', 'desc');
            
            // If Chairman, only show logs from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $query->whereHas('user', function($q) use ($skUser) {
                    $q->where('sk_station', $skUser->sk_station);
                });
            }
            
            // Pagination
            $perPage = $request->input('per_page', 10);
            $logs = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch authentication logs: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get detailed user profile
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserProfile(Request $request, $id)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Find the user
            $user = Skaccount::findOrFail($id);
            
            // Chairman can only view Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman' && 
                ($user->sk_station !== $skUser->sk_station || $user->sk_role !== 'Kagawad')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only view Kagawads from your own barangay.'
                ], 403);
            }
            
            // Add file URL if valid ID exists
            if ($user->valid_id) {
                // The valid_id is stored as the path relative to storage/app/public
                // We need to construct the public URL properly
                $user->valid_id_url = asset('storage/' . $user->valid_id);
                $user->valid_id_filename = basename($user->valid_id);
                $user->valid_id_extension = pathinfo($user->valid_id, PATHINFO_EXTENSION);
                
                // Alternative: Check if file exists and provide full path
                $fullPath = storage_path('app/public/' . $user->valid_id);
                $user->valid_id_exists = file_exists($fullPath);
            }
            
            // Get any existing admin notes for this user
            $notes = AuthenticationLog::where('user_id', $id)
                ->where('log_type', 'note')
                ->with('authenticator')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'user' => $user,
                'notes' => $notes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user profile: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Add a note to a user
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function addUserNote(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'note' => 'required|string|max:500',
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            // Find the user
            $user = Skaccount::findOrFail($id);
            
            // Chairman can only add notes to Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman' && 
                ($user->sk_station !== $skUser->sk_station || $user->sk_role !== 'Kagawad')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only add notes to Kagawads from your own barangay.'
                ], 403);
            }
            
            // Create the note
            $note = new AuthenticationLog();
            $note->user_id = $id;
            $note->authenticator_id = $skUser->id;
            $note->log_type = 'note';
            $note->action = 'Added note';
            $note->details = $request->note;
            $note->save();
            
            // Load authenticator relationship
            $note->load('authenticator');
            
            return response()->json([
                'success' => true,
                'message' => 'Note added successfully.',
                'note' => $note
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add note: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Authenticate or deauthenticate a SK user
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function authenticateUser(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'status' => 'required|in:active,not_active',
                'reason' => 'nullable|string|max:500',
                'notify_user' => 'boolean'
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            // Find the account to authenticate
            $account = Skaccount::findOrFail($id);
            
            // Chairman-specific restrictions
            if ($skUser->sk_role === 'Chairman') {
                // Chairman can only authenticate Kagawads from their barangay
                if ($account->sk_station !== $skUser->sk_station || $account->sk_role !== 'Kagawad') {
                    return response()->json([
                        'success' => false,
                        'message' => 'You can only authenticate Kagawads from your own barangay.'
                    ], 403);
                }
            } else {
                // Federasyon restrictions
                // Cannot authenticate another Federasyon
                if ($account->sk_role === 'Federasyon') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Federasyon cannot authenticate other Federasyon accounts.'
                    ], 403);
                }
                
                // Cannot authenticate themselves
                if ($skUser->id === $account->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You cannot authenticate your own account.'
                    ], 403);
                }
            }
            
            // Update authentication status
            $oldStatus = $account->authentication_status;
            $account->authentication_status = $request->status;
            
            // If authenticated, set the timestamp
            if ($request->status === 'active') {
                $account->authenticated_at = Carbon::now();
            } else {
                // If deauthenticated, clear the timestamp
                $account->authenticated_at = null;
            }
            
            $account->save();
            
            // Create log entry with authenticator role
            $log = new AuthenticationLog();
            $log->user_id = $account->id;
            $log->authenticator_id = $skUser->id;
            $log->log_type = $request->status === 'active' ? 'authentication' : 'deauthentication';
            
            // Include authenticator role in the action
            $actionText = $request->status === 'active' ? 'Authenticated' : 'De-authenticated';
            $log->action = $actionText . ' by ' . $skUser->sk_role;
            
            $log->details = $request->reason ?? '';
            $log->save();
            
            // Load relationships for response
            $log->load(['authenticator', 'user']);
            
            return response()->json([
                'success' => true,
                'message' => $request->status === 'active' 
                    ? 'User has been authenticated successfully.' 
                    : 'User has been de-authenticated successfully.',
                'user' => $account,
                'log' => $log
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk authenticate or deauthenticate users
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkAuthenticate(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'required|integer|exists:skaccounts,id',
                'status' => 'required|in:active,not_active',
                'reason' => 'nullable|string|max:500',
                'notify_users' => 'boolean'
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            $processedCount = 0;
            $skippedCount = 0;
            $userIds = $request->user_ids;
            $processedUsers = [];
            
            // Process each user
            foreach ($userIds as $userId) {
                try {
                    // Find the account
                    $account = Skaccount::findOrFail($userId);
                    
                    // Skip if current status is already the target status
                    if ($account->authentication_status === $request->status) {
                        $skippedCount++;
                        continue;
                    }
                    
                    // Chairman-specific restrictions
                    if ($skUser->sk_role === 'Chairman') {
                        // Chairman can only authenticate Kagawads from their barangay
                        if ($account->sk_station !== $skUser->sk_station || $account->sk_role !== 'Kagawad') {
                            $skippedCount++;
                            continue;
                        }
                    } else {
                        // Federasyon restrictions
                        // Cannot authenticate another Federasyon
                        if ($account->sk_role === 'Federasyon') {
                            $skippedCount++;
                            continue;
                        }
                        
                        // Cannot authenticate themselves
                        if ($skUser->id === $account->id) {
                            $skippedCount++;
                            continue;
                        }
                    }
                    
                    // Update authentication status
                    $account->authentication_status = $request->status;
                    
                    // If authenticated, set the timestamp
                    if ($request->status === 'active') {
                        $account->authenticated_at = Carbon::now();
                    } else {
                        // If deauthenticated, clear the timestamp
                        $account->authenticated_at = null;
                    }
                    
                    $account->save();
                    $processedUsers[] = $account->id;
                    $processedCount++;
                    
                } catch (\Exception $e) {
                    $skippedCount++;
                    continue;
                }
            }
            
            // Create a single log entry for bulk action
            if ($processedCount > 0) {
                $actionText = $request->status === 'active' ? 'Bulk authenticated' : 'Bulk de-authenticated';
                
                $log = new AuthenticationLog();
                $log->user_id = $processedUsers[0]; // Use first user ID as primary
                $log->authenticator_id = $skUser->id;
                $log->log_type = $request->status === 'active' ? 'bulk_authentication' : 'bulk_deauthentication';
                $log->action = $actionText . ' ' . $processedCount . ' users by ' . $skUser->sk_role;
                
                // Store all processed user IDs in details
                $details = [
                    'reason' => $request->reason ?? '',
                    'user_ids' => $processedUsers,
                    'processed_count' => $processedCount,
                    'skipped_count' => $skippedCount
                ];
                
                $log->details = json_encode($details);
                $log->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => $processedCount . ' users processed successfully. ' . $skippedCount . ' users skipped.',
                'processed_count' => $processedCount,
                'skipped_count' => $skippedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk action: ' . $e->getMessage()
            ], 500);
        }
    }
}