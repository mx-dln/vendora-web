<?php

namespace App\Http\Controllers;

use App\Models\Backup;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BackupController extends Controller
{
    public function index()
    {
        $backups = Backup::with('user')->latest()->paginate(20);

        return Inertia::render('backups/index', [
            'backups' => $backups,
            'dbSize' => $this->getDatabaseSize(),
        ]);
    }

    public function create()
    {
        try {
            $filename = 'vendora-backup-'.now()->format('Y-m-d-H-i-s').'.sql';

            if (config('database.default') === 'mysql') {
                $command = sprintf(
                    'mysqldump --user=%s --password=%s --host=%s %s > %s',
                    escapeshellarg(config('database.connections.mysql.username')),
                    escapeshellarg(config('database.connections.mysql.password')),
                    escapeshellarg(config('database.connections.mysql.host')),
                    escapeshellarg(config('database.connections.mysql.database')),
                    escapeshellarg(storage_path('app/backups/'.$filename))
                );
                exec($command, $output, $resultCode);
            } else {
                $filename = 'vendora-backup-'.now()->format('Y-m-d-H-i-s').'.sqlite';
                copy(database_path('database.sqlite'), storage_path('app/backups/'.$filename));
                $resultCode = 0;
            }

            if ($resultCode !== 0) {
                throw new \Exception('Backup command failed');
            }

            Backup::create([
                'filename' => $filename,
                'filepath' => 'backups/'.$filename,
                'size' => Storage::exists('backups/'.$filename) ? Storage::size('backups/'.$filename) : 0,
                'type' => 'manual',
                'status' => 'completed',
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'Database backup created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Backup failed: '.$e->getMessage());
        }
    }

    public function download(Backup $backup)
    {
        if (! Storage::exists($backup->filepath)) {
            return redirect()->back()->with('error', 'Backup file not found.');
        }

        return Storage::download($backup->filepath, $backup->filename);
    }

    public function destroy(Backup $backup)
    {
        if (Storage::exists($backup->filepath)) {
            Storage::delete($backup->filepath);
        }
        $backup->delete();

        return redirect()->back()->with('success', 'Backup deleted.');
    }

    private function getDatabaseSize(): string
    {
        try {
            if (config('database.default') === 'mysql') {
                $size = \DB::select('SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size FROM information_schema.tables WHERE table_schema = ?', [config('database.connections.mysql.database')]);

                return ($size[0]->size ?? 0).' MB';
            }
            if (Storage::exists(database_path('database.sqlite'))) {
                return round(Storage::size(database_path('database.sqlite')) / 1024 / 1024, 2).' MB';
            }
        } catch (\Exception $e) {
        }

        return '0 MB';
    }
}
