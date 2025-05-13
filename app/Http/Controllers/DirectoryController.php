<?php

namespace App\Http\Controllers;

use App\Models\Directory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DirectoryController extends Controller
{
    /**
     * Get all directories with filtering based on user role
     */
    public function index(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $query = Directory::with(['creator', 'supervisor']);
        
        // Apply filtering based on SK role
        if ($skUser->sk_role === 'Federasyon') {
            // Federasyon can see all entries
            // No additional filtering
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman sees directories from their station OR from 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('sk_station', $skUser->sk_station)
                ->orWhere('sk_station', 'Federation');
            });
        } elseif ($skUser->sk_role === 'Kagawad') {
            // Kagawad sees their own directories, published ones from their station, or any created by Federasyon
            $query->where(function($q) use ($skUser) {
                $q->where('created_by', $skUser->id)
                ->orWhere(function($sq) use ($skUser) {
                    $sq->where('sk_station', $skUser->sk_station)
                        ->where('status', 'published');
                })
                ->orWhere('sk_station', 'Federation')
                ->orWhereHas('creator', function($sq) {
                    $sq->where('sk_role', 'Federasyon');
                });
            });
        }
        
        $directories = $query->get();
        
        return response()->json($directories);
    }
    
    /**
     * Store a new directory
     */
    public function store(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'category' => 'required|in:executive,committee,barangay,partner',
            'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
            'position_order' => 'nullable|integer|min:1',
            'reports_to' => 'nullable|exists:directories,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Enforce station based on role
        if ($skUser->sk_role !== 'Federasyon') {
            // Non-Federasyon users can only create entries for their own station
            $request->merge(['sk_station' => $skUser->sk_station]);
        }
        
        // Check if position is available
        if ($request->position_order && $request->position_order < 999) {
            $existingPosition = Directory::where('sk_station', $request->sk_station)
                ->where('position_order', $request->position_order)
                ->where('status', 'published')
                ->exists();
                
            // If position is already taken, find next available position
            if ($existingPosition) {
                $request->merge(['position_order' => 999]); // Default to bottom
            }
        }
        
        $directory = Directory::create([
            'name' => $request->name,
            'role' => $request->role,
            'email' => $request->email,
            'phone' => $request->phone,
            'location' => $request->location,
            'category' => $request->category,
            'created_by' => $skUser->id,
            'sk_station' => $request->sk_station,
            'status' => 'published',
            'position_order' => $request->position_order ?? 999,
            'reports_to' => $request->reports_to ?: null,
        ]);
        
        return response()->json($directory, 201);
    }
    
    /**
     * Show a single directory
     */
    public function show($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $directory = Directory::with(['creator', 'supervisor', 'subordinates'])->find($id);
        
        if (!$directory) {
            return response()->json(['error' => 'Directory not found'], 404);
        }
        
        // Check permissions based on role
        if ($skUser->sk_role === 'Federasyon') {
            // Federasyon can view any directory
            return response()->json($directory);
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman can view directories from their station or created by Federasyon
            if ($directory->sk_station === $skUser->sk_station || 
                ($directory->creator && $directory->creator->sk_role === 'Federasyon') ||
                $directory->sk_station === 'Federation') {
                return response()->json($directory);
            }
        } else {
            // Kagawad can view their own directories, published ones from their station, or created by Federasyon
            if ($directory->created_by === $skUser->id || 
                ($directory->sk_station === $skUser->sk_station && $directory->status === 'published') ||
                ($directory->creator && $directory->creator->sk_role === 'Federasyon') ||
                $directory->sk_station === 'Federation') {
                return response()->json($directory);
            }
        }
        
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    
    /**
     * Update a directory
     */
    public function update(Request $request, $id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $directory = Directory::with('creator')->find($id);
        
        if (!$directory) {
            return response()->json(['error' => 'Directory not found'], 404);
        }
        
        // Check if user has permission to update
        $canUpdate = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canUpdate = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canUpdate = $directory->sk_station === $skUser->sk_station && 
                ($directory->created_by === $skUser->id || 
                ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
        } else {
            // Kagawad can only update their own entries
            $canUpdate = $directory->created_by === $skUser->id;
        }
        
        if (!$canUpdate) {
            return response()->json(['error' => 'You do not have permission to update this directory'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'category' => 'required|in:executive,committee,barangay,partner',
            'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
            'position_order' => 'nullable|integer|min:1',
            'reports_to' => 'nullable|exists:directories,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Enforce station based on role
        if ($skUser->sk_role !== 'Federasyon') {
            // Non-Federasyon users cannot change the station
            $request->merge(['sk_station' => $directory->sk_station]);
        }
        
        // Don't allow the "reports_to" to create a circular reference
        if ($request->reports_to && $request->reports_to == $directory->id) {
            return response()->json(['error' => 'A directory entry cannot report to itself'], 422);
        }
        
        // Check position order
        if ($request->position_order != $directory->position_order && $request->position_order < 999) {
            $existingPosition = Directory::where('sk_station', $request->sk_station)
                ->where('position_order', $request->position_order)
                ->where('status', 'published')
                ->where('id', '!=', $directory->id)
                ->exists();
                
            // If position is already taken, find next available position
            if ($existingPosition && $skUser->sk_role !== 'Federasyon') {
                $request->merge(['position_order' => $directory->position_order]); // Keep existing
            }
        }
        
        $directory->update([
            'name' => $request->name,
            'role' => $request->role,
            'email' => $request->email,
            'phone' => $request->phone,
            'location' => $request->location,
            'category' => $request->category,
            'sk_station' => $request->sk_station,
            'position_order' => $request->position_order,
            'reports_to' => $request->reports_to ?: null,
        ]);
        
        return response()->json($directory);
    }
    
    /**
     * Delete a directory
     */
    public function destroy($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $directory = Directory::with('creator')->find($id);
        
        if (!$directory) {
            return response()->json(['error' => 'Directory not found'], 404);
        }
        
        // Check if user has permission to delete
        $canDelete = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canDelete = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canDelete = $directory->sk_station === $skUser->sk_station && 
                ($directory->created_by === $skUser->id || 
                ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
        } else {
            $canDelete = $directory->created_by === $skUser->id;
        }
        
        if (!$canDelete) {
            return response()->json(['error' => 'You do not have permission to delete this directory'], 403);
        }
        
        // Update any entries that report to this one
        Directory::where('reports_to', $directory->id)->update(['reports_to' => null]);
        
        $directory->delete();
        
        return response()->json(['message' => 'Directory deleted successfully']);
    }
    
    /**
     * Archive a directory
     */
    public function archive($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $directory = Directory::with('creator')->find($id);
        
        if (!$directory) {
            return response()->json(['error' => 'Directory not found'], 404);
        }
        
        // Check if user has permission to archive
        $canArchive = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canArchive = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canArchive = $directory->sk_station === $skUser->sk_station && 
                ($directory->created_by === $skUser->id || 
                ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
        } else {
            $canArchive = $directory->created_by === $skUser->id;
        }
        
        if (!$canArchive) {
            return response()->json(['error' => 'You do not have permission to archive this directory'], 403);
        }
        
        // Update the status to archived
        $directory->status = 'archived';
        $directory->save();
        
        return response()->json(['message' => 'Directory archived successfully']);
    }
    
    /**
     * Restore an archived directory
     */
    public function restore($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $directory = Directory::with('creator')->find($id);
        
        if (!$directory) {
            return response()->json(['error' => 'Directory not found'], 404);
        }
        
        // Check if user has permission to restore
        $canRestore = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canRestore = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canRestore = $directory->sk_station === $skUser->sk_station && 
                ($directory->created_by === $skUser->id || 
                ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
        } else {
            $canRestore = $directory->created_by === $skUser->id;
        }
        
        if (!$canRestore) {
            return response()->json(['error' => 'You do not have permission to restore this directory'], 403);
        }
        
        // Update the status to published
        $directory->status = 'published';
        $directory->save();
        
        return response()->json(['message' => 'Directory restored successfully']);
    }
    
    /**
     * Get published directories for the Youth page
     */
    public function getPublicDirectories()
    {
        $directories = Directory::where('status', 'published')->get();
        
        return response()->json($directories);
    }
    
    /**
     * Get organization chart data for a specific station
     */
    public function getOrgChartData($station)
    {
        // Get all published directories for the station or Federation
        $directories = Directory::with(['supervisor', 'subordinates'])
            ->where('status', 'published')
            ->where(function($query) use ($station) {
                $query->where('sk_station', $station)
                      ->orWhere('sk_station', 'Federation');
            })
            ->orderBy('position_order', 'asc')
            ->get();
        
        return response()->json($directories);
    }
    
    /**
     * Bulk operations to improve performance
     */
    public function bulkOperations(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'operation' => 'required|in:archive,restore,delete',
            'ids' => 'required|array',
            'ids.*' => 'required|exists:directories,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $operation = $request->operation;
        $ids = $request->ids;
        $successCount = 0;
        $errorCount = 0;
        
        // Perform bulk operation in a transaction for better performance
        DB::beginTransaction();
        
        try {
            foreach ($ids as $id) {
                $directory = Directory::find($id);
                
                if (!$directory) {
                    $errorCount++;
                    continue;
                }
                
                // Check permission
                $canPerform = false;
                
                if ($skUser->sk_role === 'Federasyon') {
                    $canPerform = true;
                } elseif ($skUser->sk_role === 'Chairman') {
                    $canPerform = $directory->sk_station === $skUser->sk_station && 
                        ($directory->created_by === $skUser->id || 
                        ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
                } else {
                    $canPerform = $directory->created_by === $skUser->id;
                }
                
                if (!$canPerform) {
                    $errorCount++;
                    continue;
                }
                
                // Perform the operation
                switch ($operation) {
                    case 'archive':
                        $directory->status = 'archived';
                        $directory->save();
                        $successCount++;
                        break;
                        
                    case 'restore':
                        $directory->status = 'published';
                        $directory->save();
                        $successCount++;
                        break;
                        
                    case 'delete':
                        // Update any entries that report to this one
                        Directory::where('reports_to', $directory->id)->update(['reports_to' => null]);
                        $directory->delete();
                        $successCount++;
                        break;
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => "Bulk {$operation} completed successfully",
                'success_count' => $successCount,
                'error_count' => $errorCount
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => "Failed to perform bulk {$operation}",
                'message' => $e->getMessage()
            ], 500);
        }
    }
}