<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Response;

class TemplateController extends Controller
{
    /**
     * Display a listing of the templates.
     */
    public function index(Request $request)
    {
        $query = Template::query();
        
        // Apply filters
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Include archived if requested
        if ($request->has('include_archived') && $request->include_archived) {
            // Include all
        } else {
            $query->where('status', 'active');
        }
        
        $templates = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json($templates);
    }

    /**
     * Store a newly created template.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:reports,forms,letters,budget,events',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Handle file upload
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('templates', $fileName, 'public');
            
            // Get file type and size
            $fileType = strtolower($file->getClientOriginalExtension());
            $fileSize = $this->formatFileSize($file->getSize());
            
            // Create template record
            $template = Template::create([
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
                'file_type' => $fileType,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'status' => 'active'
            ]);
            
            return response()->json([
                'success' => true,
                'template' => $template
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified template.
     */
    public function update(Request $request, Template $template)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:reports,forms,letters,budget,events',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $updateData = [
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category
            ];

            // Handle file update
            if ($request->hasFile('file')) {
                // Delete old file
                if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                    Storage::disk('public')->delete($template->file_path);
                }
                
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('templates', $fileName, 'public');
                
                $updateData['file_path'] = $filePath;
                $updateData['file_type'] = strtolower($file->getClientOriginalExtension());
                $updateData['file_size'] = $this->formatFileSize($file->getSize());
            }

            $template->update($updateData);

            return response()->json([
                'success' => true,
                'template' => $template
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified template.
     */
    public function destroy(Template $template)
    {
        try {
            // Delete associated files
            if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }
            
            $template->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive a template.
     */
    public function archive(Template $template)
    {
        $template->update(['status' => 'archived']);
        
        return response()->json([
            'success' => true,
            'message' => 'Template archived successfully'
        ]);
    }

    /**
     * Restore an archived template.
     */
    public function restore(Template $template)
    {
        $template->update(['status' => 'active']);
        
        return response()->json([
            'success' => true,
            'message' => 'Template restored successfully'
        ]);
    }

    /**
     * Preview a template file.
     */
    public function preview(Template $template)
    {
        try {
            $filePath = storage_path('app/public/' . $template->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            $fileType = $template->file_type;
            $mimeType = $this->getMimeType($fileType);
            
            return Response::make(file_get_contents($filePath), 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $template->title . '.' . $fileType . '"',
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to preview template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a template.
     */
    public function download(Template $template)
    {
        try {
            // Increment download count
            $template->incrementDownloadCount();
            
            // Get file path
            $filePath = storage_path('app/public/' . $template->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            // Return file download
            return response()->download($filePath, $template->title . '.' . $template->file_type);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format file size to human readable format.
     */
    private function formatFileSize($bytes)
    {
        if ($bytes === 0) return '0 B';
        
        $k = 1024;
        $sizes = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }

    /**
     * Get MIME type based on file extension.
     */
    private function getMimeType($extension)
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }
}