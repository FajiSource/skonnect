<?php

namespace App\Http\Controllers;

use App\Models\BarangayPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BarangayPolicyController extends Controller
{
    public function index(Request $request)
    {
        // Explicitly convert the string "true"/"false" to boolean
        $archived = filter_var($request->query('archived', 'false'), FILTER_VALIDATE_BOOLEAN);
        
        $policies = BarangayPolicy::where('archived', $archived)->get();
        
        // Add file_url to each policy
        foreach ($policies as $policy) {
            $policy->file_url = $policy->file_path ? Storage::url($policy->file_path) : null;
        }
        
        return $policies;
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|mimes:pdf|max:20480',
            'year' => 'required|integer',
            'barangay' => 'required|string' 
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('barangay-policies', $fileName, 'public');

        // Get barangay from request directly instead of user object
        $barangay = $request->barangay;
        
        // Fallback to user's SK station if the barangay wasn't explicitly provided
        if (empty($barangay) && $request->user() && $request->user()->sk_station) {
            $barangay = $request->user()->sk_station;
        }

        // Ensure barangay is not null or empty
        if (empty($barangay)) {
            return response()->json([
                'message' => 'Barangay is required. Please select a barangay or log in with an account that has a barangay assigned.'
            ], 422);
        }

        $policy = BarangayPolicy::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => 'Barangay Resolution', // Fixed category
            'file_path' => $filePath,
            'year' => $request->year,
            'barangay' => $barangay,
            'archived' => false
        ]);
        
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }

    public function update(Request $request, BarangayPolicy $barangayPolicy)
    {
        $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'file' => 'nullable|file|mimes:pdf|max:20480',
            'year' => 'integer'
        ]);

        $data = $request->only(['title', 'description', 'year']);

        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($barangayPolicy->file_path);
            
            // Store new file
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $data['file_path'] = $file->storeAs('barangay-policies', $fileName, 'public');
        }

        $barangayPolicy->update($data);
        
        // Add file_url to the response
        $barangayPolicy->file_url = Storage::url($barangayPolicy->file_path);
        
        return $barangayPolicy;
    }

    public function destroy(BarangayPolicy $barangayPolicy)
    {
        Storage::disk('public')->delete($barangayPolicy->file_path);
        $barangayPolicy->delete();
        return response()->noContent();
    }
    
    public function archive(Request $request, BarangayPolicy $barangayPolicy)
    {
        $request->validate([
            'archive_reason' => 'required|string|max:255',
        ]);
    
        $barangayPolicy->archived = true;
        $barangayPolicy->archive_reason = $request->archive_reason;
        $barangayPolicy->archived_at = Carbon::now();
        $barangayPolicy->save();
        
        // Add file_url to the response
        $barangayPolicy->file_url = Storage::url($barangayPolicy->file_path);
        
        return $barangayPolicy;
    }
    
    public function restore(BarangayPolicy $barangayPolicy)
    {
        $barangayPolicy->archived = false;
        $barangayPolicy->archive_reason = null;
        $barangayPolicy->archived_at = null;
        $barangayPolicy->save();
        
        // Add file_url to the response
        $barangayPolicy->file_url = Storage::url($barangayPolicy->file_path);
        
        return $barangayPolicy;
    }
}