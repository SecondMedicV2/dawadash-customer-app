package com.dawadash.customer;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Minimal FileProvider replacement (no AndroidX in this build) that exposes only
 * files in cacheDir/camera, so the camera app can write a prescription photo and
 * the WebView can read it back.
 */
public class GenericFileProvider extends ContentProvider {
    static final String AUTHORITY = "com.dawadash.customer.fileprovider";
    static final String CAMERA_DIR = "camera";
    private static final Pattern SAFE_NAME = Pattern.compile("^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,120}$");

    static Uri uriFor(String fileName) {
        return new Uri.Builder().scheme("content").authority(AUTHORITY)
                .appendPath(CAMERA_DIR).appendPath(fileName).build();
    }

    private File fileFor(Uri uri) throws FileNotFoundException {
        List<String> segments = uri.getPathSegments();
        if (segments.size() != 2 || !CAMERA_DIR.equals(segments.get(0))) throw new FileNotFoundException(uri.toString());
        String name = segments.get(1);
        if (!SAFE_NAME.matcher(name).matches() || name.contains("..")) throw new FileNotFoundException(uri.toString());
        return new File(new File(getContext().getCacheDir(), CAMERA_DIR), name);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File file;
        try {
            file = fileFor(uri);
        } catch (FileNotFoundException e) {
            return null;
        }
        String[] cols = projection != null ? projection : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cursor = new MatrixCursor(cols, 1);
        Object[] row = new Object[cols.length];
        for (int i = 0; i < cols.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = file.getName();
            else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = file.length();
        }
        cursor.addRow(row);
        return cursor;
    }

    @Override
    public String getType(Uri uri) {
        String path = uri.getPath();
        if (path != null) {
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".pdf")) return "application/pdf";
        }
        return "application/octet-stream";
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        try {
            return fileFor(uri).delete() ? 1 : 0;
        } catch (FileNotFoundException e) {
            return 0;
        }
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = fileFor(uri);
        int pfdMode = ParcelFileDescriptor.parseMode(mode);
        if ((pfdMode & ParcelFileDescriptor.MODE_READ_ONLY) == pfdMode && !file.exists()) {
            throw new FileNotFoundException(uri.toString());
        }
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();
        return ParcelFileDescriptor.open(file, pfdMode | (pfdMode == ParcelFileDescriptor.MODE_READ_ONLY ? 0 : ParcelFileDescriptor.MODE_CREATE));
    }
}
