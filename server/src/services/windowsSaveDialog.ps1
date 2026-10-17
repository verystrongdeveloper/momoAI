param([switch]$ValidateOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -ReferencedAssemblies System.Windows.Forms,System.Drawing -TypeDefinition @'
using System;
using System.Text;
using System.Diagnostics;
using System.Windows.Forms;
using System.Runtime.InteropServices;
public static class MomoSaveDialogWindow {
    private sealed class BrowserOwner : IWin32Window {
        public IntPtr Handle { get; private set; }
        public BrowserOwner(IntPtr handle) { Handle = handle; }
    }
    private delegate bool EnumWindow(IntPtr window, IntPtr state);
    [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
    [DllImport("user32.dll")] private static extern bool EnumThreadWindows(uint thread, EnumWindow callback, IntPtr state);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr window, StringBuilder name, int size);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] private static extern bool SetWindowPos(IntPtr window, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr window);
    private static IWin32Window FindBrowserOwner() {
        IntPtr window = GetForegroundWindow();
        uint process;
        GetWindowThreadProcessId(window, out process);
        try {
            string name = Process.GetProcessById((int)process).ProcessName.ToLowerInvariant();
            if (name == "brave" || name == "chrome" || name == "msedge" || name == "firefox" || name == "opera")
                return new BrowserOwner(window);
        } catch (ArgumentException) { }
        return null;
    }
    private static bool RaiseOwnDialog(uint thread) {
        bool raised = false;
        // Only this UI thread's common dialog, never an unrelated app's window.
        EnumThreadWindows(thread, delegate(IntPtr window, IntPtr state) {
            var name = new StringBuilder(256);
            GetClassName(window, name, name.Capacity);
            if (name.ToString() != "#32770" || !IsWindowVisible(window)) return true;
            // Windows may deny foreground activation by a background server.
            // Put the actual dialog (not its transparent owner) above the browser.
            raised = SetWindowPos(window, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
            SetForegroundWindow(window);
            return false;
        }, IntPtr.Zero);
        return raised;
    }
    public static string Show(string filename, string extension) {
        // Resolve ownership before creating any helper window. A dialog owned by
        // the browser stays above it instead of belonging to a background shell.
        IWin32Window owner = FindBrowserOwner();
        uint thread = GetCurrentThreadId();
        using (var fallback = new Form())
        using (var dialog = new SaveFileDialog())
        using (var timer = new Timer()) {
            fallback.ShowInTaskbar = false;
            fallback.Opacity = 0;
            fallback.TopMost = true;
            fallback.StartPosition = FormStartPosition.CenterScreen;
            if (owner == null) { fallback.Show(); owner = fallback; }
            dialog.Title = "다른 이름으로 저장";
            dialog.FileName = filename;
            dialog.DefaultExt = extension;
            dialog.Filter = extension.ToUpperInvariant() + "|*." + extension;
            dialog.AddExtension = true;
            dialog.OverwritePrompt = true;
            timer.Interval = 100;
            // Execute on the native dialog's UI thread entirely in C#. PowerShell
            // callbacks are not used while its pipeline is blocked in ShowDialog.
            timer.Tick += delegate { if (RaiseOwnDialog(thread)) timer.Stop(); };
            timer.Start();
            try { return dialog.ShowDialog(owner) == DialogResult.OK ? dialog.FileName : null; }
            finally { timer.Stop(); }
        }
    }
}
'@
if ($ValidateOnly) { return }
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::Write([MomoSaveDialogWindow]::Show($env:MOMO_SAVE_FILENAME, $env:MOMO_SAVE_EXTENSION))
