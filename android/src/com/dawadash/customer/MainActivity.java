package com.dawadash.customer;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Thin native shell around the hosted DawaDash customer web app.
 * The app itself is loaded live from Firebase Hosting, so every web deploy
 * reaches installed APKs on next launch without reinstalling.
 */
public class MainActivity extends Activity {
    static final String APP_URL = "https://dawadash-customer.web.app/";
    private static final List<String> APP_HOSTS = Arrays.asList(
            "dawadash-customer.web.app", "dawadash-customer.firebaseapp.com");

    private static final int REQ_FILE_CHOOSER = 1001;
    private static final int REQ_CAMERA_PERMISSION = 1002;
    private static final int BG = 0xFFF8FAFC;
    private static final int PRIMARY = 0xFF0D9488;
    private static final int TEXT = 0xFF0F172A;
    private static final int MUTED = 0xFF64748B;

    private WebView webView;
    private ProgressBar progressBar;
    private View splashView;
    private View offlineView;
    private boolean mainFrameFailed;

    private ValueCallback<Uri[]> filePathCallback;
    private WebChromeClient.FileChooserParams pendingChooserParams;
    private Uri cameraOutputUri;
    private File cameraOutputFile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);

        webView = new WebView(this);
        webView.setBackgroundColor(BG);
        root.addView(webView, match());

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, dp(3)));

        offlineView = buildOfflineView();
        offlineView.setVisibility(View.GONE);
        root.addView(offlineView, match());

        splashView = buildSplashView();
        root.addView(splashView, match());

        setContentView(root);
        applySystemBars(root);
        setupWebView();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            loadApp();
        }
    }

    // ---------- Layout ----------

    private FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private View buildSplashView() {
        LinearLayout splash = new LinearLayout(this);
        splash.setOrientation(LinearLayout.VERTICAL);
        splash.setGravity(Gravity.CENTER);
        splash.setBackgroundColor(BG);
        splash.setClickable(true);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.splash_logo);
        logo.setAdjustViewBounds(true);
        splash.addView(logo, new LinearLayout.LayoutParams(dp(140), dp(140)));

        ProgressBar spinner = new ProgressBar(this);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(dp(32), dp(32));
        sp.topMargin = dp(24);
        splash.addView(spinner, sp);
        return splash;
    }

    private View buildOfflineView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(BG);
        box.setPadding(dp(32), dp(32), dp(32), dp(32));
        box.setClickable(true);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.splash_logo);
        box.addView(logo, new LinearLayout.LayoutParams(dp(96), dp(96)));

        TextView title = new TextView(this);
        title.setText("You're offline");
        title.setTextColor(TEXT);
        title.setTextSize(20);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        tp.topMargin = dp(20);
        box.addView(title, tp);

        TextView body = new TextView(this);
        body.setText("DawaDash needs an internet connection. Check your mobile data or Wi-Fi and try again.");
        body.setTextColor(MUTED);
        body.setTextSize(14);
        body.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bp.topMargin = dp(8);
        box.addView(body, bp);

        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setAllCaps(false);
        retry.setTextColor(Color.WHITE);
        retry.setBackgroundColor(PRIMARY);
        retry.setOnClickListener(v -> retry());
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(dp(180), dp(48));
        rp.topMargin = dp(24);
        box.addView(retry, rp);
        return box;
    }

    /** Android 15 (target 35) draws edge-to-edge: pad content so it never sits under the status/nav bar or keyboard. */
    @SuppressWarnings("deprecation")
    private void applySystemBars(View root) {
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(light, light);
            }
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
        } else {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            root.setSystemUiVisibility(flags);
            root.setFitsSystemWindows(true);
        }
    }

    // ---------- WebView ----------

    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setUserAgentString(s.getUserAgentString() + " DawaDashAndroid/" + BuildInfo.VERSION_NAME);
        // index.html is served no-cache, hashed bundles are immutable: online launches always get the latest deploy.
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        s.setTextZoom(100);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
                if (("https".equals(scheme)) && APP_HOSTS.contains(uri.getHost())) {
                    return false; // stay inside the app
                }
                openExternally(uri);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!mainFrameFailed) {
                    offlineView.setVisibility(View.GONE);
                    hideSplash();
                }
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showOffline();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                progressBar.setProgress(newProgress);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                pendingChooserParams = params;
                if (wantsCamera(params) && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA_PERMISSION);
                    return true;
                }
                return launchChooser(params, true);
            }
        });
    }

    private void loadApp() {
        mainFrameFailed = false;
        // Offline: fall back to the last cached copy instead of a blank screen.
        webView.getSettings().setCacheMode(isOnline() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);
        webView.loadUrl(APP_URL);
    }

    private void retry() {
        offlineView.setVisibility(View.GONE);
        splashView.setVisibility(View.VISIBLE);
        loadApp();
    }

    private void showOffline() {
        mainFrameFailed = true;
        hideSplash();
        offlineView.setVisibility(View.VISIBLE);
    }

    private void hideSplash() {
        if (splashView.getVisibility() == View.VISIBLE) {
            splashView.animate().alpha(0f).setDuration(200).withEndAction(() -> {
                splashView.setVisibility(View.GONE);
                splashView.setAlpha(1f);
            });
        }
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void openExternally(Uri uri) {
        try {
            Intent intent = "intent".equalsIgnoreCase(uri.getScheme())
                    ? Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                    : new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);
            startActivity(intent);
        } catch (Exception ignored) {
            // No app can handle this link; stay on the current page.
        }
    }

    // ---------- File upload (prescriptions) ----------

    private boolean acceptsImages(WebChromeClient.FileChooserParams params) {
        String[] types = params == null ? null : params.getAcceptTypes();
        if (types == null || types.length == 0) return true;
        for (String t : types) {
            if (t == null || t.isEmpty() || t.startsWith("image/") || t.equals("*/*")) return true;
        }
        return false;
    }

    private boolean wantsCamera(WebChromeClient.FileChooserParams params) {
        return acceptsImages(params);
    }

    private String[] mimeTypes(WebChromeClient.FileChooserParams params) {
        List<String> out = new ArrayList<>();
        String[] types = params == null ? null : params.getAcceptTypes();
        if (types != null) {
            for (String t : types) {
                if (t == null) continue;
                for (String part : t.split(",")) {
                    part = part.trim();
                    if (part.isEmpty()) continue;
                    if (part.equals(".pdf")) part = "application/pdf";
                    else if (part.startsWith(".")) continue;
                    out.add(part);
                }
            }
        }
        if (out.isEmpty()) {
            out.add("image/*");
            out.add("application/pdf");
        }
        return out.toArray(new String[0]);
    }

    private boolean launchChooser(WebChromeClient.FileChooserParams params, boolean cameraAllowed) {
        Intent camera = null;
        if (cameraAllowed && wantsCamera(params)
                && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            camera = buildCameraIntent();
        }

        // Page asked for the camera directly (capture attribute): open it straight away.
        if (camera != null && params != null && params.isCaptureEnabled()) {
            try {
                startActivityForResult(camera, REQ_FILE_CHOOSER);
                return true;
            } catch (ActivityNotFoundException ignored) {
                camera = null;
            }
        }

        String[] mimes = mimeTypes(params);
        Intent picker = new Intent(Intent.ACTION_GET_CONTENT);
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        picker.setType(mimes.length == 1 ? mimes[0] : "*/*");
        if (mimes.length > 1) picker.putExtra(Intent.EXTRA_MIME_TYPES, mimes);
        if (params != null && params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
            picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        }

        Intent chooser = Intent.createChooser(picker, "Upload prescription");
        if (camera != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        try {
            startActivityForResult(chooser, REQ_FILE_CHOOSER);
            return true;
        } catch (ActivityNotFoundException e) {
            finishChooser(null);
            return false;
        }
    }

    private Intent buildCameraIntent() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(getPackageManager()) == null) return null;
        File dir = new File(getCacheDir(), GenericFileProvider.CAMERA_DIR);
        if (!dir.exists() && !dir.mkdirs()) return null;
        cameraOutputFile = new File(dir, "rx_" + System.currentTimeMillis() + ".jpg");
        cameraOutputUri = GenericFileProvider.uriFor(cameraOutputFile.getName());
        intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraOutputUri);
        intent.setClipData(ClipData.newRawUri("", cameraOutputUri));
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return intent;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQ_CAMERA_PERMISSION) {
            // Granted or not, still let the user pick an existing photo or PDF.
            if (filePathCallback != null) launchChooser(pendingChooserParams, true);
            return;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ_FILE_CHOOSER) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getClipData() != null && data.getClipData().getItemCount() > 0
                    && data.getData() == null) {
                ClipData clip = data.getClipData();
                results = new Uri[clip.getItemCount()];
                for (int i = 0; i < clip.getItemCount(); i++) results[i] = clip.getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            } else if (cameraOutputFile != null && cameraOutputFile.length() > 0) {
                results = new Uri[]{cameraOutputUri};
            }
        }
        finishChooser(results);
    }

    private void finishChooser(Uri[] results) {
        if (filePathCallback != null) filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        pendingChooserParams = null;
        if (results == null && cameraOutputFile != null) cameraOutputFile.delete();
        cameraOutputFile = null;
        cameraOutputUri = null;
    }

    // ---------- Lifecycle ----------

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        if (mainFrameFailed && isOnline()) retry();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        handleBackNavigation();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            handleBackNavigation();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private void handleBackNavigation() {
        if (offlineView != null && offlineView.getVisibility() == View.VISIBLE) {
            showExitConfirmationDialog();
            return;
        }

        if (webView == null) {
            showExitConfirmationDialog();
            return;
        }

        // Ask the web app to navigate one page/tab/modal back
        webView.evaluateJavascript(
            "(function() { try { return (typeof window.handleHardwareBack === 'function') ? (window.handleHardwareBack() ? 'true' : 'false') : 'false'; } catch(e) { return 'false'; } })();",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if ("\"true\"".equalsIgnoreCase(value) || "true".equalsIgnoreCase(value)) {
                        // Handled by web app (navigated one page back or closed modal)
                        return;
                    }

                    // If webView has browser history entries, navigate back
                    if (webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }

                    // Root screen reached: confirm with user before exit
                    showExitConfirmationDialog();
                }
            }
        );
    }

    private void showExitConfirmationDialog() {
        if (isFinishing() || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && isDestroyed())) {
            return;
        }

        android.app.AlertDialog dialog = new android.app.AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Light_Dialog_Alert)
                .setTitle("Exit DawaDash?")
                .setMessage("Are you sure you want to exit the app?")
                .setIcon(R.mipmap.ic_launcher)
                .setPositiveButton("Exit", (d, which) -> {
                    d.dismiss();
                    finishAffinity();
                })
                .setNegativeButton("Cancel", (d, which) -> {
                    d.dismiss();
                })
                .setCancelable(true)
                .create();

        dialog.show();

        try {
            Button posBtn = dialog.getButton(android.content.DialogInterface.BUTTON_POSITIVE);
            if (posBtn != null) {
                posBtn.setTextColor(PRIMARY);
            }
            Button negBtn = dialog.getButton(android.content.DialogInterface.BUTTON_NEGATIVE);
            if (negBtn != null) {
                negBtn.setTextColor(MUTED);
            }
        } catch (Exception ignored) {}
    }
}
