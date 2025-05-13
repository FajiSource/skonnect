<?php

namespace App\Http\Controllers;

use App\Models\Award;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AwardController extends Controller
{
    // Get all awards with filtering based on user role
    public function index(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $query = Award::with('creator');
        
        if ($skUser->sk_role === 'Federasyon') {
            // Federasyon can see all entries
            // No additional filtering needed
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman sees awards from their station OR 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('sk_station', $skUser->sk_station)
                ->orWhere('sk_station', 'Federation');
            });
        } elseif ($skUser->sk_role === 'Kagawad') {
            // Kagawad sees their own awards, published awards from their station, OR awards from 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('created_by', $skUser->id)
                ->orWhere(function($sub) use ($skUser) {
                    $sub->where('sk_station', $skUser->sk_station)
                        ->where('status', 'published');
                })
                ->orWhere('sk_station', 'Federation');
            });
        }
        
        $awards = $query->get();
        
        return response()->json($awards);
    }
    
    // Store a new award
    public function store(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|max:255',
            'recipients' => 'required|string|max:255',
            'date_awarded' => 'required|date',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'main_image' => 'required|image|max:5120', // 5MB max
            'gallery' => 'nullable|array',
            'gallery.*.image' => 'nullable|image|max:5120',
            'gallery.*.caption' => 'nullable|string|max:255',
            'gallery.*.subcaption' => 'nullable|string',
            'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Enforce station based on role
        if ($skUser->sk_role !== 'Federasyon') {
            // Non-Federasyon users can only create entries for their own station
            $request->merge(['sk_station' => $skUser->sk_station]);
        }
        
        // Upload main image
        $mainImagePath = $request->file('main_image')->store('awards', 'public');
        
        // Process gallery images if present
        $galleryData = [];
        if ($request->hasFile('gallery_images')) {
            $galleryImages = $request->file('gallery_images');
            $galleryCaptions = $request->input('gallery_captions', []);
            $gallerySubcaptions = $request->input('gallery_subcaptions', []);
            
            foreach ($galleryImages as $index => $image) {
                $path = $image->store('awards/gallery', 'public');
                $galleryData[] = [
                    'path' => $path,
                    'caption' => $galleryCaptions[$index] ?? '',
                    'subcaption' => $gallerySubcaptions[$index] ?? '',
                ];
            }
        }
        
        $award = Award::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'recipients' => $request->recipients,
            'date_awarded' => $request->date_awarded,
            'year' => $request->year,
            'main_image' => $mainImagePath,
            'gallery' => !empty($galleryData) ? $galleryData : null,
            'sk_station' => $request->sk_station,
            'status' => 'published',
            'created_by' => $skUser->id,
        ]);
        
        return response()->json($award, 201);
    }
    
    // Update an award - Completely fixed version
    public function update(Request $request, $id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // Log the request data for debugging
        Log::info('Update Award Request Data:', [
            'id' => $id,
            'has_title' => $request->has('title'),
            'title' => $request->input('title'),
            'has_description' => $request->has('description'),
            'description' => $request->input('description'),
            'has_category' => $request->has('category'),
            'category' => $request->input('category'),
            'has_recipients' => $request->has('recipients'),
            'recipients' => $request->input('recipients'),
            'has_date_awarded' => $request->has('date_awarded'),
            'date_awarded' => $request->input('date_awarded'),
            'has_year' => $request->has('year'),
            'year' => $request->input('year'),
            'has_sk_station' => $request->has('sk_station'),
            'sk_station' => $request->input('sk_station'),
            'has_main_image' => $request->hasFile('main_image'),
            'has_remove_main_image' => $request->has('remove_main_image'),
            'remove_main_image' => $request->input('remove_main_image'),
            'has_gallery_images' => $request->hasFile('gallery_images'),
            'has_gallery_remove' => $request->has('gallery_remove'),
            'gallery_remove' => $request->input('gallery_remove'),
        ]);
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to update
        $canUpdate = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canUpdate = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman can update awards from their station (if created by them or Kagawad)
            $canUpdate = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot edit Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canUpdate = false;
            }
        } else {
            // Kagawad can only update their own entries
            $canUpdate = $award->created_by === $skUser->id;
            
            // Kagawad cannot edit Federasyon's or Chairman's awards
            if ($award->creator && ($award->creator->sk_role === 'Federasyon' || $award->creator->sk_role === 'Chairman')) {
                $canUpdate = false;
            }
        }
        
        if (!$canUpdate) {
            return response()->json(['error' => 'You do not have permission to update this award'], 403);
        }
        
        // Start building the update data array
        $updateData = [];
        
        // Handle text fields - use has() instead of filled() for FormData
        if ($request->has('title')) {
            $updateData['title'] = $request->input('title');
        }
        
        if ($request->has('description')) {
            $updateData['description'] = $request->input('description');
        }
        
        if ($request->has('category')) {
            $updateData['category'] = $request->input('category');
        }
        
        if ($request->has('recipients')) {
            $updateData['recipients'] = $request->input('recipients');
        }
        
        if ($request->has('date_awarded')) {
            $updateData['date_awarded'] = $request->input('date_awarded');
        }
        
        if ($request->has('year')) {
            $updateData['year'] = $request->input('year');
        }
        
        // Handle station update - only Federasyon can change this
        if ($request->has('sk_station') && $skUser->sk_role === 'Federasyon') {
            $updateData['sk_station'] = $request->input('sk_station');
        }
        
        // Handle main image update/removal
        $removeMainImage = $request->input('remove_main_image') === 'true';
        
        if ($request->hasFile('main_image')) {
            // Delete old image
            Storage::disk('public')->delete($award->main_image);
            
            // Store new image
            $mainImagePath = $request->file('main_image')->store('awards', 'public');
            $updateData['main_image'] = $mainImagePath;
        } elseif ($removeMainImage) {
            // Cannot remove main image without providing a new one
            return response()->json([
                'success' => false,
                'errors' => [
                    'main_image' => ['Main image is required. Please provide a new image.']
                ]
            ], 422);
        }
        
        // Process gallery images
        $galleryData = $award->gallery ?? [];
        $galleryUpdated = false;
        
        // Handle removing gallery images
        if ($request->has('gallery_remove')) {
            $removeIndices = $request->input('gallery_remove');
            
            // Convert to array if it's a string
            if (!is_array($removeIndices)) {
                $removeIndices = explode(',', $removeIndices);
            }
            
            foreach ($removeIndices as $index) {
                if (isset($galleryData[$index])) {
                    // Delete the image file
                    Storage::disk('public')->delete($galleryData[$index]['path']);
                    
                    // Remove entry from gallery data
                    unset($galleryData[$index]);
                }
            }
            
            // Reindex the array
            $galleryData = array_values($galleryData);
            $galleryUpdated = true;
        }
        
        // Handle adding new gallery images
        if ($request->hasFile('gallery_images')) {
            $galleryImages = $request->file('gallery_images');
            $galleryCaptions = $request->input('gallery_captions', []);
            $gallerySubcaptions = $request->input('gallery_subcaptions', []);
            
            foreach ($galleryImages as $index => $image) {
                $path = $image->store('awards/gallery', 'public');
                $galleryData[] = [
                    'path' => $path,
                    'caption' => isset($galleryCaptions[$index]) ? $galleryCaptions[$index] : '',
                    'subcaption' => isset($gallerySubcaptions[$index]) ? $gallerySubcaptions[$index] : '',
                ];
            }
            
            $galleryUpdated = true;
        }
        
        // Handle updating existing gallery captions
        if ($request->has('update_gallery_captions')) {
            $updateCaptions = $request->input('update_gallery_captions', []);
            $updateSubcaptions = $request->input('update_gallery_subcaptions', []);
            
            foreach ($updateCaptions as $index => $caption) {
                if (isset($galleryData[$index])) {
                    $galleryData[$index]['caption'] = $caption;
                    
                    if (isset($updateSubcaptions[$index])) {
                        $galleryData[$index]['subcaption'] = $updateSubcaptions[$index];
                    }
                    
                    $galleryUpdated = true;
                }
            }
        }
        
        // Only update gallery if we made changes
        if ($galleryUpdated) {
            $updateData['gallery'] = !empty($galleryData) ? $galleryData : null;
        }
        
        // Log the update data
        Log::info('Award Update Data:', $updateData);
        
        // Only update if we have data to update
        if (!empty($updateData)) {
            $award->update($updateData);
            
            // Refresh the award data
            $award = Award::with('creator')->find($id);
            
            Log::info('Award updated successfully');
        } else {
            Log::warning('No update data found for award');
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Award updated successfully',
            'award' => $award
        ]);
    }
    
    // Delete an award
    public function destroy($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to delete
        $canDelete = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canDelete = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canDelete = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot delete Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canDelete = false;
            }
        } else {
            $canDelete = $award->created_by === $skUser->id;
        }
        
        if (!$canDelete) {
            return response()->json(['error' => 'You do not have permission to delete this award'], 403);
        }
        
        // Delete award images
        Storage::disk('public')->delete($award->main_image);
        
        if (!empty($award->gallery)) {
            foreach ($award->gallery as $galleryItem) {
                Storage::disk('public')->delete($galleryItem['path']);
            }
        }
        
        $award->delete();
        
        return response()->json(['message' => 'Award deleted successfully']);
    }
    
    // Archive an award
    public function archive($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to archive
        $canArchive = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canArchive = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canArchive = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot archive Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canArchive = false;
            }
        } else {
            $canArchive = $award->created_by === $skUser->id;
        }
        
        if (!$canArchive) {
            return response()->json(['error' => 'You do not have permission to archive this award'], 403);
        }
        
        $award->update(['status' => 'archived']);
        
        return response()->json(['message' => 'Award archived successfully']);
    }
    
    // Restore an archived award
    public function restore($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to restore
        $canRestore = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canRestore = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canRestore = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot restore Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canRestore = false;
            }
        } else {
            $canRestore = $award->created_by === $skUser->id;
        }
        
        if (!$canRestore) {
            return response()->json(['error' => 'You do not have permission to restore this award'], 403);
        }
        
        $award->update(['status' => 'published']);
        
        return response()->json(['message' => 'Award restored successfully']);
    }
    
    // Get published awards for the Youth page
    public function getPublicAwards()
    {
        $awards = Award::where('status', 'published')->get();
        
        return response()->json([
            'success' => true,
            'awards' => $awards
        ]);
    }
    
    // Bulk archive awards
    public function bulkArchive(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canArchive = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canArchive = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canArchive = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot archive Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canArchive = false;
                }
            } else {
                $canArchive = $award->created_by === $skUser->id;
            }
            
            if ($canArchive) {
                $award->update(['status' => 'archived']);
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Archived $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
    
    // Bulk restore awards
    public function bulkRestore(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canRestore = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canRestore = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canRestore = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot restore Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canRestore = false;
                }
            } else {
                $canRestore = $award->created_by === $skUser->id;
            }
            
            if ($canRestore) {
                $award->update(['status' => 'published']);
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Restored $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
    
    // Bulk delete awards
    public function bulkDelete(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canDelete = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canDelete = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canDelete = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot delete Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canDelete = false;
                }
            } else {
                $canDelete = $award->created_by === $skUser->id;
            }
            
            if ($canDelete) {
                // Delete award images
                Storage::disk('public')->delete($award->main_image);
                
                if (!empty($award->gallery)) {
                    foreach ($award->gallery as $galleryItem) {
                        Storage::disk('public')->delete($galleryItem['path']);
                    }
                }
                
                $award->delete();
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Deleted $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
}