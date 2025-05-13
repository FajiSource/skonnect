<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        // Explicitly convert the string "true"/"false" to boolean
        $archived = filter_var($request->query('archived', 'false'), FILTER_VALIDATE_BOOLEAN);
        
        $policies = Policy::where('archived', $archived)->get();
        
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
            'category' => 'required|string',
            'file' => 'required|file|mimes:pdf|max:20480',
            'year' => 'required|integer'
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('pdfs', $fileName, 'public');

        $policy = Policy::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'file_path' => $filePath,
            'year' => $request->year,
            'archived' => false
        ]);
        
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }

    public function update(Request $request, Policy $policy)
    {
        $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'category' => 'string',
            'file' => 'nullable|file|mimes:pdf|max:20480',
            'year' => 'integer'
        ]);

        $data = $request->only(['title', 'description', 'category', 'year']);

        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($policy->file_path);
            
            // Store new file
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $data['file_path'] = $file->storeAs('pdfs', $fileName, 'public');
        }

        $policy->update($data);
        
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }

    public function destroy(Policy $policy)
    {
        Storage::disk('public')->delete($policy->file_path);
        $policy->delete();
        return response()->noContent();
    }
    
    public function archive(Request $request, Policy $policy)
    {
        $request->validate([
            'archive_reason' => 'required|string|max:255',
        ]);
    
        $policy->archived = true;
        $policy->archive_reason = $request->archive_reason;
        $policy->archived_at = Carbon::now();
        $policy->save();
        
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }
    
    public function restore(Policy $policy)
    {
        $policy->archived = false;
        $policy->archive_reason = null;
        $policy->archived_at = null;
        $policy->save();
        
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }
    
    public function show(Policy $policy)
    {
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }
}