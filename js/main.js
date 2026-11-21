/**
 * LINUX.EDU - Core Application Engine (Vintage Edition)
 * Handles curriculum progress tracking, terminal virtualization,
 * interactive components, and cohesive navigation across modules.
 */

// ==========================================
// 0. AUTH GUARD — Redirect to login if not authenticated
// ==========================================
(function() {
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login');
    const isAuthenticated = sessionStorage.getItem('linuxedu_auth') === '1';
    if (!isLoginPage && !isAuthenticated) {
        window.location.replace('login.html');
    }
})();

// ==========================================
// 1. CURRICULUM PROGRESS TRACKER (localStorage)
// ==========================================
const LinuxEduTracker = {
    MODULES: [
        { id: 'modul-1', name: 'Apa Itu Linux?', slug: 'apa-itu-linux.html', num: 1 },
        { id: 'modul-2', name: 'Kelebihan & Kekurangan', slug: 'kelebihan-kekurangan.html', num: 2 },
        { id: 'modul-3', name: 'Distro Linux', slug: 'distro-linux.html', num: 3 },
        { id: 'modul-4', name: 'Perintah Dasar', slug: 'perintah-dasar.html', num: 4 },
        { id: 'modul-5', name: 'Penutup & Setup', slug: 'penutup.html', num: 5 }
    ],

    getProgress() {
        try {
            const data = localStorage.getItem('linux_edu_progress');
            return data ? JSON.parse(data) : { completed: [], currentStep: 1, missions: [] };
        } catch (e) {
            return { completed: [], currentStep: 1, missions: [] };
        }
    },

    saveProgress(state) {
        try {
            localStorage.setItem('linux_edu_progress', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save progress to localStorage', e);
        }
    },

    markVisited(moduleId) {
        const state = this.getProgress();
        if (moduleId && !state.completed.includes(moduleId)) {
            state.completed.push(moduleId);
            this.saveProgress(state);
        }
        this.renderRoadmapBadges();
    },

    completeAndNext(currentModuleId, nextUrl) {
        const state = this.getProgress();
        if (currentModuleId && !state.completed.includes(currentModuleId)) {
            state.completed.push(currentModuleId);
            this.saveProgress(state);
        }
        showToast('Progres tersimpan! Beralih ke modul berikutnya...');
        setTimeout(() => {
            window.location.href = nextUrl;
        }, 600);
    },

    resetProgress() {
        if (confirm('Apakah Anda yakin ingin mengulang progres belajar dari awal?')) {
            localStorage.removeItem('linux_edu_progress');
            showToast('Progres belajar telah direset ke 0%.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        }
    },

    renderHeaderProgress() {
        // Live status indicator in navbar removed by user request
    },

    renderRoadmapBadges() {
        const state = this.getProgress();
        this.MODULES.forEach(m => {
            const badge = document.getElementById(`badge-${m.id}`);
            if (badge) {
                if (state.completed.includes(m.id)) {
                    badge.innerHTML = `<i class="fa-solid fa-circle-check text-brand-green mr-1"></i> SELESAI`;
                    badge.className = "text-[10px] font-mono font-bold text-brand-green px-2 py-0.5 rounded bg-[#EEF5EF] border border-brand-green/30";
                }
            }
        });

        // Summary on Penutup page
        const summaryContainer = document.getElementById('completed-modules-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = this.MODULES.map(m => {
                const isDone = state.completed.includes(m.id);
                return `
                    <div class="p-3.5 rounded-xl border ${isDone ? 'border-brand-green/40 bg-[#EEF5EF]' : 'border-brand-border bg-brand-card'} flex items-center justify-between shadow-sm">
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${isDone ? 'bg-brand-green text-white' : 'bg-brand-surface text-brand-muted border border-brand-border'}">
                                ${isDone ? '✓' : m.num}
                            </span>
                            <div>
                                <div class="text-xs font-bold text-brand-ink">${m.name}</div>
                                <div class="text-[10px] text-brand-grayText font-mono">${isDone ? 'Telah dipelajari' : 'Belum selesai'}</div>
                            </div>
                        </div>
                        <a href="${m.slug}" class="text-xs font-mono font-bold ${isDone ? 'text-brand-green hover:underline' : 'text-brand-muted hover:text-brand-ink'}">
                            ${isDone ? 'Ulas Modul →' : 'Pelajari →'}
                        </a>
                    </div>
                `;
            }).join('');
        }
    }
};

// ==========================================
// 2. TOAST NOTIFICATIONS & COPY HELPER
// ==========================================
function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#2B231D] text-[#EDE4D8] font-mono text-xs font-medium rounded-xl border border-[#42372F] shadow-2xl transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2.5';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-terminal text-brand-amber"></i> <span>${message}</span>`;
    toast.classList.remove('translate-y-10', 'opacity-0');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
    }, 2800);
}

function copyCmd(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Perintah disalin: "${text}"`);
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`Perintah disalin: "${text}"`);
}

// ==========================================
// 3. VIRTUAL FILESYSTEM & CLI SANDBOX
// ==========================================
const VirtualFS = {
    currentPath: '/home/user',
    tree: {
        '/': { type: 'dir', files: ['home', 'etc', 'var', 'bin'] },
        '/bin': { type: 'dir', files: ['bash', 'sh', 'ls', 'cat', 'pwd', 'mkdir', 'rm', 'cp', 'mv'] },
        '/etc': {
            type: 'dir',
            files: ['hostname', 'os-release'],
            contents: {
                'hostname': 'linuxedu-vm\n',
                'os-release': 'NAME="LinuxEdu"\nVERSION="2026 LTS (GNU/Linux)"\nID=linuxedu\nPRETTY_NAME="LinuxEdu OS"\nHOME_URL="https://linux.edu"'
            }
        },
        '/var': { type: 'dir', files: ['log'] },
        '/var/log': {
            type: 'dir',
            files: ['syslog'],
            contents: {
                'syslog': '[OK] Kernel initialized.\n[OK] Mounted root filesystem.\n[OK] Started POSIX Shell Sandbox.'
            }
        },
        '/home': { type: 'dir', files: ['user'] },
        '/home/user': {
            type: 'dir',
            files: ['catatan.txt', 'readme.md', 'proyek'],
            contents: {
                'catatan.txt': 'Selamat datang di Linux! File ini dibuat untuk latihan membaca teks terminal dengan perintah cat.',
                'readme.md': '# Panduan Belajar\n1. Pahami struktur direktori Linux\n2. Latih perintah dasar: ls, cd, mkdir, touch\n3. Eksplorasi tanpa rasa takut!'
            }
        },
        '/home/user/proyek': {
            type: 'dir',
            files: ['app.py', 'config.json'],
            contents: {
                'app.py': 'print("Halo dari Linux! Python berjalan dengan lancar.")',
                'config.json': '{\n  "version": "1.0.0",\n  "env": "production"\n}'
            }
        }
    },

    history: [],
    historyIndex: -1,

    // Guided Missions state
    completedMissions: {
        pwd: false,
        ls: false,
        mkdir: false,
        cd: false,
        touch: false
    }
};

function runCmd(commandText) {
    const inputEl = document.getElementById('cli-input');
    if (inputEl) {
        inputEl.value = commandText;
        inputEl.focus();
        execCLI(commandText);
    }
}

function clearTerm() {
    const out = document.getElementById('term-output');
    if (out) {
        out.innerHTML = `
            <div class="text-[#88796B] text-[11px] mb-2 font-mono">
                Terminal Linux.Edu siap digunakan. Ketik <span class="text-[#E5A842] font-bold">help</span> untuk daftar perintah atau selesaikan 5 Misi di atas!
            </div>
            <div><span class="text-[#E5A842] font-bold">user@linuxedu:${getPrettyPath()}$</span></div>
        `;
    }
}

function getPrettyPath() {
    const p = VirtualFS.currentPath;
    if (p === '/home/user') return '~';
    if (p.startsWith('/home/user/')) return '~/' + p.slice(11);
    return p;
}

function handleCLI(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('cli-input');
    if (!input) return;
    const cmd = input.value.trim();
    if (cmd) {
        VirtualFS.history.push(cmd);
        VirtualFS.historyIndex = VirtualFS.history.length;
        execCLI(cmd);
        input.value = '';
    }
}

function execCLI(cmd) {
    const out = document.getElementById('term-output');
    if (!out) return;

    const currentPromptPath = getPrettyPath();
    const line = document.createElement('div');
    line.className = 'mt-1';
    line.innerHTML = `<span class="text-[#E5A842] font-bold">user@linuxedu:${currentPromptPath}$</span> <span class="text-[#EDE4D8]">${escapeHtml(cmd)}</span>`;
    out.appendChild(line);

    const res = document.createElement('div');
    res.className = 'text-[#DDD3C1] ml-1 mb-2 font-mono text-xs whitespace-pre-wrap leading-relaxed';

    const parts = cmd.trim().split(/\s+/);
    const main = parts[0].toLowerCase();
    const arg1 = parts[1] || '';
    const arg2 = parts[2] || '';

    switch (main) {
        case 'pwd':
            res.textContent = VirtualFS.currentPath;
            checkMission('pwd');
            break;

        case 'ls':
            const showAll = parts.includes('-a') || parts.includes('-la') || parts.includes('-al');
            const showLong = parts.includes('-l') || parts.includes('-la') || parts.includes('-al');
            const currentDirObj = VirtualFS.tree[VirtualFS.currentPath];

            if (!currentDirObj || currentDirObj.type !== 'dir') {
                res.textContent = `ls: cannot access directory`;
            } else {
                let fileList = [...currentDirObj.files];
                if (showAll) {
                    fileList = ['.', '..', ...fileList];
                }

                if (showLong) {
                    const rows = fileList.map(item => {
                        const isDir = item.endsWith('/') || (VirtualFS.tree[resolvePath(item)] && VirtualFS.tree[resolvePath(item)].type === 'dir');
                        const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                        const size = isDir ? '4096' : ' 1024';
                        const colorClass = isDir ? 'text-[#E5A842] font-bold' : 'text-[#EDE4D8]';
                        return `${perms} 1 user user ${size} Nov  8 12:00 <span class="${colorClass}">${item}</span>`;
                    });
                    res.innerHTML = rows.join('\n');
                } else {
                    res.innerHTML = fileList.map(item => {
                        const isDir = item.endsWith('/') || (VirtualFS.tree[resolvePath(item)] && VirtualFS.tree[resolvePath(item)].type === 'dir');
                        return isDir ? `<span class="text-[#E5A842] font-bold">${item}/</span>` : `<span class="text-[#EDE4D8]">${item}</span>`;
                    }).join('   ');
                }
            }
            checkMission('ls');
            break;

        case 'cd':
            let target = arg1;
            if (!target || target === '~') {
                VirtualFS.currentPath = '/home/user';
                res.textContent = '';
            } else if (target === '..') {
                if (VirtualFS.currentPath !== '/') {
                    const segs = VirtualFS.currentPath.split('/').filter(Boolean);
                    segs.pop();
                    VirtualFS.currentPath = '/' + segs.join('/');
                    if (VirtualFS.currentPath === '//') VirtualFS.currentPath = '/';
                }
                res.textContent = '';
            } else if (target === '/') {
                VirtualFS.currentPath = '/';
                res.textContent = '';
            } else {
                const resolved = resolvePath(target);
                if (VirtualFS.tree[resolved] && VirtualFS.tree[resolved].type === 'dir') {
                    VirtualFS.currentPath = resolved;
                    res.textContent = '';
                    if (target.includes('belajar_linux')) {
                        checkMission('cd');
                    }
                } else {
                    res.textContent = `bash: cd: ${target}: No such file or directory`;
                }
            }
            break;

        case 'mkdir':
            if (!arg1) {
                res.textContent = 'mkdir: missing operand\nTry \'mkdir <nama_folder>\'';
            } else {
                const newFolderPath = resolvePath(arg1);
                const cur = VirtualFS.tree[VirtualFS.currentPath];
                if (cur && cur.type === 'dir') {
                    if (cur.files.includes(arg1)) {
                        res.textContent = `mkdir: cannot create directory '${arg1}': File exists`;
                    } else {
                        cur.files.push(arg1);
                        VirtualFS.tree[newFolderPath] = { type: 'dir', files: [] };
                        res.innerHTML = `<span class="text-[#7BC584]">Direktori '${escapeHtml(arg1)}' berhasil dibuat.</span>`;
                        if (arg1 === 'belajar_linux') {
                            checkMission('mkdir');
                        }
                    }
                }
            }
            break;

        case 'touch':
            if (!arg1) {
                res.textContent = 'touch: missing file operand\nTry \'touch <nama_file.txt>\'';
            } else {
                const cur = VirtualFS.tree[VirtualFS.currentPath];
                if (cur && cur.type === 'dir') {
                    if (!cur.files.includes(arg1)) {
                        cur.files.push(arg1);
                        if (!cur.contents) cur.contents = {};
                        cur.contents[arg1] = '';
                    }
                    res.innerHTML = `<span class="text-[#7BC584]">Berkas '${escapeHtml(arg1)}' siap digunakan.</span>`;
                    if (arg1 === 'catatan.txt' || arg1.endsWith('.txt')) {
                        checkMission('touch');
                    }
                }
            }
            break;

        case 'cat':
            if (!arg1) {
                res.textContent = 'cat: missing operand. Contoh: cat catatan.txt';
            } else {
                const cur = VirtualFS.tree[VirtualFS.currentPath];
                if (cur && cur.contents && cur.contents[arg1] !== undefined) {
                    res.textContent = cur.contents[arg1] || '(Berkas kosong)';
                } else {
                    const resolved = resolvePath(arg1);
                    let found = false;
                    for (const dir in VirtualFS.tree) {
                        if (VirtualFS.tree[dir].contents && VirtualFS.tree[dir].contents[arg1]) {
                            res.textContent = VirtualFS.tree[dir].contents[arg1];
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        res.textContent = `cat: ${arg1}: No such file or directory`;
                    }
                }
            }
            break;

        case 'rm':
            if (!arg1) {
                res.textContent = 'rm: missing operand';
            } else {
                const targetFile = parts.includes('-r') || parts.includes('-rf') ? (arg2 || arg1) : arg1;
                const cur = VirtualFS.tree[VirtualFS.currentPath];
                if (cur && cur.files.includes(targetFile)) {
                    cur.files = cur.files.filter(f => f !== targetFile);
                    if (cur.contents && cur.contents[targetFile]) delete cur.contents[targetFile];
                    res.textContent = `'${targetFile}' berhasil dihapus.`;
                } else {
                    res.textContent = `rm: cannot remove '${targetFile}': No such file or directory`;
                }
            }
            break;

        case 'whoami':
            res.textContent = 'user';
            break;

        case 'uname':
            if (parts.includes('-a')) {
                res.textContent = 'Linux linuxedu 6.8.0-generic #42-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
            } else {
                res.textContent = 'Linux';
            }
            break;

        case 'df':
            res.textContent = `Filesystem     1K-blocks      Used Available Use% Mounted on\n/dev/root      164812320  44081232 120731088  27% /\ntmpfs            4096000         0   4096000   0% /dev/shm`;
            break;

        case 'neofetch':
            res.innerHTML = `
<div class="flex items-start gap-4 text-xs font-mono">
<pre class="text-[#E5A842] leading-none select-none font-bold">
       .--.
      |o_o |
      |:_/ |
     //   \\ \\
    (|     | )
   /'\\_   _/\\
   \\___)=(___/
</pre>
<div class="space-y-0.5 text-[#DDD3C1]">
  <div><span class="text-[#E5A842] font-bold">user@linuxedu</span></div>
  <div class="text-[#42372F]">-----------------</div>
  <div><span class="text-[#E5A842]">OS:</span> LinuxEdu GNU/Linux 2026 LTS</div>
  <div><span class="text-[#E5A842]">Kernel:</span> 6.8.0-generic</div>
  <div><span class="text-[#E5A842]">Uptime:</span> 12 hours, 34 mins</div>
  <div><span class="text-[#E5A842]">Shell:</span> bash 5.2.21</div>
  <div><span class="text-[#E5A842]">Memory:</span> 512MiB / 8192MiB</div>
</div>
</div>`;
            break;

        case 'clear':
            clearTerm();
            return;

        case 'help':
            res.innerHTML = `
<span class="text-[#E5A842] font-bold">Daftar Perintah yang Didukung di Sandbox Ini:</span>
  • <span class="text-white font-bold">pwd</span>               : Menampilkan direktori kerja saat ini
  • <span class="text-white font-bold">ls</span> [opsi]         : Menampilkan daftar berkas (-l, -la, -a)
  • <span class="text-white font-bold">cd</span> &lt;direktori&gt;    : Berpindah direktori (~ untuk home, .. untuk naik)
  • <span class="text-white font-bold">mkdir</span> &lt;folder&gt;    : Membuat folder/direktori baru
  • <span class="text-white font-bold">touch</span> &lt;berkas&gt;    : Membuat berkas teks kosong
  • <span class="text-white font-bold">cat</span> &lt;berkas&gt;      : Membaca isi berkas ke layar
  • <span class="text-white font-bold">rm</span> &lt;target&gt;       : Menghapus berkas (-r untuk direktori)
  • <span class="text-white font-bold">whoami</span>            : Menampilkan username aktif
  • <span class="text-white font-bold">uname -a</span>          : Informasi kernel sistem operasi
  • <span class="text-white font-bold">neofetch</span>          : Menampilkan spek & maskot resmi Tux
  • <span class="text-white font-bold">clear</span>             : Membersihkan tampilan terminal
`;
            break;

        default:
            res.innerHTML = `<span class="text-[#E06C75]">bash: ${escapeHtml(main)}: command not found.</span>\nKetik <span class="text-[#E5A842] cursor-pointer underline" onclick="runCmd('help')">'help'</span> untuk melihat perintah yang tersedia.`;
    }

    out.appendChild(res);
    out.scrollTop = out.scrollHeight;

    // Update prompt
    const promptSpan = document.getElementById('term-prompt-prefix');
    if (promptSpan) {
        promptSpan.textContent = `user@linuxedu:${getPrettyPath()}$`;
    }
}

function resolvePath(target) {
    if (target.startsWith('/')) return target;
    const current = VirtualFS.currentPath === '/' ? '' : VirtualFS.currentPath;
    return `${current}/${target}`.replace(/\/+/g, '/');
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function checkMission(type) {
    if (!VirtualFS.completedMissions[type]) {
        VirtualFS.completedMissions[type] = true;
        const badge = document.getElementById(`mission-check-${type}`);
        const card = document.getElementById(`mission-card-${type}`);
        if (badge) {
            badge.className = "text-brand-green text-xs font-mono font-bold flex items-center gap-1";
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Selesai`;
        }
        if (card) {
            card.classList.add('border-brand-green', 'bg-[#EEF5EF]');
            card.classList.remove('border-brand-border');
        }

        // Calculate missions completed
        const count = Object.values(VirtualFS.completedMissions).filter(Boolean).length;
        const total = Object.keys(VirtualFS.completedMissions).length;
        const progressEl = document.getElementById('mission-progress-bar');
        const textEl = document.getElementById('mission-progress-text');
        if (progressEl) {
            progressEl.style.width = `${(count / total) * 100}%`;
        }
        if (textEl) {
            textEl.textContent = `${count}/${total} Misi Selesai`;
        }

        if (count === total) {
            showToast('🎉 Hebat! Semua 5 misi terminal berhasil diselesaikan!');
        }
    }
}

// Table Filter Function
function filterTable() {
    const input = document.getElementById('cmd-filter');
    if (!input) return;
    const val = input.value.toLowerCase();
    const rows = document.getElementById('table-body')?.getElementsByTagName('tr') || [];
    for (let r of rows) {
        r.style.display = r.textContent.toLowerCase().includes(val) ? '' : 'none';
    }
}

// ==========================================
// 4. ARCHITECTURE LAYER EXPLORER (Module 1)
// ==========================================
const ARCH_DETAILS = {
    user: {
        title: "Layer 4: User Space (Aplikasi & Desktop)",
        subtitle: "Tempat Anda dan aplikasi berinteraksi sehari-hari",
        desc: "Merupakan lingkungan non-privilege di mana browser (Firefox), code editor (VS Code), shell (Bash), dan desktop environment (GNOME/KDE) berjalan. Jika sebuah aplikasi di layer ini crash, sistem operasi dan kernel tetap berjalan normal tanpa blue-screen.",
        analogy: "Ibarat tamu di sebuah gedung yang hanya memiliki akses ke ruangan yang diizinkan tanpa bisa merombak instalasi listrik atau fondasi gedung.",
        tech: ["Firefox", "VS Code", "Bash Shell", "GNOME / KDE Plasma", "LibreOffice"]
    },
    gnu: {
        title: "Layer 3: GNU System & Runtime Library (glibc)",
        subtitle: "Jembatan penerjemah perintah aplikasi ke bahasa Kernel",
        desc: "Menyediakan pustaka runtime standar C (glibc) dan utilitas inti (Coreutils seperti ls, cp, mv). Ketika Anda mengetik 'ls' di terminal, program tersebut memanggil fungsi di glibc, yang kemudian mengirimkan System Call resmi ke Kernel Linux.",
        analogy: "Ibarat staf penerjemah resmi yang mengubah instruksi bahasa manusia menjadi protokol baku yang dipahami oleh pimpinan gedung.",
        tech: ["GNU C Library (glibc)", "Coreutils (ls, cat, mkdir)", "GCC Compiler", "Systemd Init"]
    },
    kernel: {
        title: "Layer 2: Kernel Linux (Jantung Monolitik)",
        subtitle: "Pengelola hardware, memori, proses, dan hak akses keamanan",
        desc: "Diciptakan pertama kali oleh Linus Torvalds pada 1991. Bekerja dalam mode terlindungi (Ring 0 / Kernel Space). Bertanggung jawab atas CPU Scheduler (membagi waktu prosesor), Virtual Memory Manager (alokasi RAM), Virtual Filesystem (VFS), dan Device Drivers.",
        analogy: "Ibarat pengelola sentral gedung: mengatur suplai listrik, jalur pipa air, lift darurat, dan satpam penjaga kunci brankas.",
        tech: ["Process Scheduler", "Memory Management (Paging)", "Device Drivers", "VFS (ext4, btrfs)", "Netfilter / Firewall"]
    },
    hardware: {
        title: "Layer 1: Perangkat Keras Fisik (Hardware)",
        subtitle: "Mesin komputasi fisik tempat kode dieksekusi",
        desc: "Komponen fisik aktual: Prosesor (x86_64, ARM64, RISC-V), keping memori DRAM, drive penyimpanan NVMe/SSD, GPU grafis, dan port jaringan Ethernet/Wi-Fi.",
        analogy: "Ibarat struktur fisik beton, batu bata, kabel tembaga, dan fondasi pondasi gedung itu sendiri.",
        tech: ["CPU (Intel, AMD, ARM)", "RAM DDR4/DDR5", "NVMe / SSD / HDD", "Kartu Jaringan (NIC)", "GPU"]
    }
};

function selectArchLayer(layerKey) {
    const data = ARCH_DETAILS[layerKey];
    if (!data) return;

    // Remove active styles from all buttons
    document.querySelectorAll('.arch-btn').forEach(btn => {
        btn.classList.remove('border-brand-amber', 'bg-brand-surface', 'text-brand-ink');
        btn.classList.add('border-brand-border', 'bg-brand-card', 'text-brand-grayText');
    });

    const activeBtn = document.getElementById(`arch-btn-${layerKey}`);
    if (activeBtn) {
        activeBtn.classList.remove('border-brand-border', 'bg-brand-card', 'text-brand-grayText');
        activeBtn.classList.add('border-brand-amber', 'bg-brand-surface', 'text-brand-ink');
    }

    const titleEl = document.getElementById('arch-display-title');
    const subEl = document.getElementById('arch-display-sub');
    const descEl = document.getElementById('arch-display-desc');
    const analogyEl = document.getElementById('arch-display-analogy');
    const techEl = document.getElementById('arch-display-tech');

    if (titleEl) titleEl.textContent = data.title;
    if (subEl) subEl.textContent = data.subtitle;
    if (descEl) descEl.textContent = data.desc;
    if (analogyEl) analogyEl.innerHTML = `<span class="text-brand-amber font-bold font-mono">Analogi Nyata:</span> ${data.analogy}`;
    if (techEl) {
        techEl.innerHTML = data.tech.map(t => `<span class="px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border text-[11px] font-mono text-brand-ink">${t}</span>`).join('');
    }
}

// ==========================================
// 5. DISTRO RECOMMENDER & FILTER (Module 3)
// ==========================================
const DISTROS_DATA = [
    {
        name: "Ubuntu",
        family: "Debian",
        category: "beginner",
        badge: "Paling Populer",
        pkg: "apt / snap",
        de: "GNOME kustom",
        desc: "Standar emas bagi pemula dan pengembang web. Didukung dokumentasi melimpah di internet.",
        target: "Pemula, Developer Web, Mahasiswa",
        lahir: "2004",
        rilis: "LTS setiap 2 tahun (5 thn dukungan)",
        ram_idle: "~600 MB",
        cmd_instal: "sudo apt install <nama-paket>",
        cmd_update: "sudo apt update && sudo apt upgrade",
        fakta: "Ubuntu berasal dari kata Afrika Selatan yang bermakna 'kemanusiaan untuk sesama'. Digunakan di lebih dari 55% server cloud publik.",
        kelebihan: ["Dokumentasi terlengkap", "Driver hardware otomatis", "Snap Store terintegrasi"],
        kekurangan: ["Snap kadang lambat", "GNOME cukup berat di RAM"]
    },
    {
        name: "Linux Mint",
        family: "Debian/Ubuntu",
        category: "beginner",
        badge: "Transisi Windows Terbaik",
        pkg: "apt / Flatpak",
        de: "Cinnamon",
        desc: "Tampilan desktop yang sangat familiar bagi pengguna Windows. Siap pakai langsung tanpa setup rumit.",
        target: "Eks-Pengguna Windows, Pemula",
        lahir: "2006",
        rilis: "Mengikuti siklus Ubuntu LTS",
        ram_idle: "~500 MB",
        cmd_instal: "sudo apt install <nama-paket>",
        cmd_update: "sudo apt update && sudo apt upgrade",
        fakta: "Linux Mint secara konsisten menempati posisi #1 DistroWatch untuk distro paling banyak diunduh selama bertahun-tahun.",
        kelebihan: ["Tampilan mirip Windows 7/10", "Codec multimedia sudah terinstal", "Update manager yang aman"],
        kekurangan: ["Rilis agak lambat", "Snap tidak disertakan secara default"]
    },
    {
        name: "Debian",
        family: "Debian",
        category: "server",
        badge: "Fondasi Batu Karang",
        pkg: "apt / dpkg",
        de: "Bebas pilih (GNOME, XFCE)",
        desc: "Dikenal sangat konservatif dan stabil tanpa crash. Menjadi induk dari Ubuntu dan ratusan distro lainnya.",
        target: "Server Produksi, Sysadmin, Kestabilan",
        lahir: "1993",
        rilis: "Setiap ~2 tahun (paket sangat konservatif)",
        ram_idle: "~350 MB",
        cmd_instal: "sudo apt install <nama-paket>",
        cmd_update: "sudo apt update && sudo apt full-upgrade",
        fakta: "Debian adalah salah satu distro tertua yang masih aktif. Ubuntu, Kali, dan ratusan distro lain adalah turunan langsungnya.",
        kelebihan: ["Sangat stabil untuk server", "Bebas software non-free opsional", "Komunitas besar sejak 1993"],
        kekurangan: ["Paket bisa jauh tertinggal versinya", "Instalasi lebih manual"]
    },
    {
        name: "Fedora Workstation",
        family: "Red Hat",
        category: "developer",
        badge: "Inovasi Modern & Upstream",
        pkg: "dnf / Flatpak",
        de: "Vanilla GNOME",
        desc: "Selalu membawa teknologi Linux terdepan (Wayland, PipeWire). Digunakan langsung oleh Linus Torvalds.",
        target: "Software Engineer, Kontributor Open Source",
        lahir: "2003",
        rilis: "Setiap ~6 bulan (13 bulan dukungan)",
        ram_idle: "~650 MB",
        cmd_instal: "sudo dnf install <nama-paket>",
        cmd_update: "sudo dnf upgrade --refresh",
        fakta: "Fedora adalah 'laboratorium inovasi' Red Hat. Teknologi yang lolos uji di Fedora akan masuk ke RHEL (Red Hat Enterprise Linux).",
        kelebihan: ["Selalu paket terbaru", "Wayland & PipeWire by default", "SELinux aktif untuk keamanan"],
        kekurangan: ["Siklus rilis pendek, perlu upgrade rutin", "Dukungan codec proprietary terbatas"]
    },
    {
        name: "Arch Linux",
        family: "Arch",
        category: "advanced",
        badge: "Rolling Release & DIY",
        pkg: "pacman / AUR",
        de: "Pilihan pengguna (Minimalis)",
        desc: "Instalasi manual dari command line. Memberi pemahaman mendalam tentang setiap baut dan mur di OS Anda.",
        target: "Pengguna Mahir, Penggemar Kustomisasi",
        lahir: "2002",
        rilis: "Rolling — tidak ada versi mayor, selalu terbaru",
        ram_idle: "~80 MB (tanpa DE)",
        cmd_instal: "sudo pacman -S <nama-paket>",
        cmd_update: "sudo pacman -Syu",
        fakta: "Arch Wiki adalah sumber dokumentasi Linux terlengkap di internet — bahkan pengguna distro lain pun sering merujuk ke sana.",
        kelebihan: ["Selalu software terbaru", "AUR: ribuan paket komunitas", "Kontrol penuh atas setiap komponen"],
        kekurangan: ["Instalasi awal sangat kompleks", "Update bisa membreak sistem jika tidak teliti"]
    },
    {
        name: "Kali Linux",
        family: "Debian",
        category: "security",
        badge: "Spesialis Keamanan Siber",
        pkg: "apt",
        de: "XFCE / GNOME",
        desc: "Dilengkapi lebih dari 600 perangkat pengujian penetrasi dan analisis forensik digital out-of-the-box.",
        target: "Penetration Tester, Praktisi Cyber Security",
        lahir: "2013",
        rilis: "Rolling (berbasis Debian Testing)",
        ram_idle: "~500 MB",
        cmd_instal: "sudo apt install <nama-paket>",
        cmd_update: "sudo apt update && sudo apt full-upgrade",
        fakta: "Kali Linux bukan untuk penggunaan desktop harian. Ia dirancang khusus sebagai platform pengujian keamanan jaringan dan forensik digital.",
        kelebihan: ["600+ tools security preinstalled", "Mode live USB tanpa instalasi", "Dukungan ARM & Raspberry Pi"],
        kekurangan: ["Bukan untuk pemula", "Tidak ideal sebagai OS harian", "Perlu hati-hati soal legalitas penggunaan"]
    },
    {
        name: "Xubuntu / Lubuntu",
        family: "Debian/Ubuntu",
        category: "lightweight",
        badge: "Penyelamat Laptop Jadul",
        pkg: "apt",
        de: "XFCE / LXQt",
        desc: "Hanya butuh RAM 512MB-1GB saat idle. Menghidupkan kembali laptop lama yang lambat di Windows.",
        target: "PC Spek Rendah, Komputer Lama",
        lahir: "2006 / 2008",
        rilis: "Mengikuti siklus Ubuntu LTS",
        ram_idle: "~220–350 MB",
        cmd_instal: "sudo apt install <nama-paket>",
        cmd_update: "sudo apt update && sudo apt upgrade",
        fakta: "Lubuntu menggunakan LXQt — salah satu desktop environment paling ringan. Bisa berjalan di komputer dengan RAM hanya 512MB.",
        kelebihan: ["RAM sangat efisien", "Berbasis Ubuntu (ekosistem luas)", "Cocok untuk PC 32-bit lama"],
        kekurangan: ["Tampilan kurang modern", "Fitur lebih terbatas dari Ubuntu penuh"]
    }
];

function filterDistros(cat) {
    // Update active tab buttons
    document.querySelectorAll('.distro-filter-btn').forEach(btn => {
        btn.classList.remove('bg-brand-amber', 'text-white', 'font-bold');
        btn.classList.add('bg-brand-surface', 'text-brand-grayText');
    });

    const activeBtn = document.getElementById(`distro-tab-${cat}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-brand-surface', 'text-brand-grayText');
        activeBtn.classList.add('bg-brand-amber', 'text-white', 'font-bold');
    }

    const container = document.getElementById('distros-grid-container');
    if (!container) return;

    const filtered = cat === 'all' ? DISTROS_DATA : DISTROS_DATA.filter(d => d.category === cat || (cat === 'beginner' && (d.category === 'beginner')));

    container.innerHTML = filtered.map(d => `
        <div class="distro-card bg-brand-card border border-brand-border flex flex-col justify-between overflow-hidden">
            <!-- Card Header -->
            <div class="p-6 space-y-4">
                <div class="flex items-start justify-between gap-2 text-xs font-mono">
                    <span class="px-2.5 py-0.5 bg-brand-surface border border-brand-border text-brand-amber font-bold leading-relaxed">${d.badge}</span>
                    <span class="text-brand-muted font-sans text-[11px] shrink-0 pt-0.5">${d.family} Base</span>
                </div>
                <div>
                    <h3 class="text-2xl font-bold font-serif text-brand-ink">${d.name}</h3>
                    <p class="text-xs text-brand-grayText leading-relaxed mt-1.5">${d.desc}</p>
                </div>

                <!-- Specs Table -->
                <div class="space-y-1.5 pt-1 text-xs font-mono border-t border-brand-border/60">
                    <div class="flex justify-between pt-2">
                        <span class="text-brand-muted">Package Manager</span>
                        <span class="text-brand-amber font-bold">${d.pkg}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-brand-muted">Default Desktop</span>
                        <span class="text-brand-ink">${d.de}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-brand-muted">RAM Idle</span>
                        <span class="text-brand-ink">${d.ram_idle}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-brand-muted">Lahir</span>
                        <span class="text-brand-ink">${d.lahir}</span>
                    </div>
                    <div class="flex justify-between pb-1">
                        <span class="text-brand-muted">Cocok Untuk</span>
                        <span class="text-brand-grayText font-sans text-right max-w-[55%]">${d.target}</span>
                    </div>
                </div>

                <!-- Commands -->
                <div class="space-y-1.5 pt-1">
                    <div class="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-bold">Perintah Utama</div>
                    <div class="p-2.5 bg-[#1F1A16] font-mono text-xs space-y-1 rounded-sm">
                        <div>
                            <span class="text-[#88796B]"># Instal: </span>
                            <span class="text-[#E5A842] select-all">${d.cmd_instal}</span>
                        </div>
                        <div>
                            <span class="text-[#88796B]"># Update: </span>
                            <span class="text-[#E5A842] select-all">${d.cmd_update}</span>
                        </div>
                    </div>
                </div>

                <!-- Pro/Con -->
                <div class="grid grid-cols-2 gap-3 pt-1">
                    <div class="space-y-1">
                        <div class="text-[10px] font-mono text-brand-green font-bold uppercase tracking-wider">✓ Kelebihan</div>
                        <ul class="space-y-1">
                            ${d.kelebihan.map(k => `<li class="text-[11px] text-brand-grayText font-sans flex items-start gap-1.5"><span class="text-brand-green shrink-0 mt-0.5">+</span>${k}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">✗ Tantangan</div>
                        <ul class="space-y-1">
                            ${d.kekurangan.map(k => `<li class="text-[11px] text-brand-grayText font-sans flex items-start gap-1.5"><span class="text-red-400 shrink-0 mt-0.5">−</span>${k}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Fun Fact -->
                <div class="p-3 bg-brand-cardAlt border-l-2 border-brand-amber">
                    <div class="text-[10px] font-mono font-bold text-brand-amber mb-1 uppercase tracking-wider">Tahukah Kamu?</div>
                    <p class="text-[11px] text-brand-grayText font-sans leading-relaxed">${d.fakta}</p>
                </div>
            </div>

            <!-- Card Footer -->
            <div class="px-6 pb-6 pt-4 border-t border-brand-border">
                <div class="text-[10px] font-mono text-brand-muted uppercase tracking-wider text-center">
                    Rilis: ${d.rilis}
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 6. REAL CERTIFICATE GENERATOR (Module 5)
// ==========================================
function updateCertificatePreview() {
    const nameInput = document.getElementById('cert-student-name');
    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Peserta Linux.Edu';

    const displayName = document.getElementById('cert-display-name');
    if (displayName) displayName.textContent = name;

    const dateEl = document.getElementById('cert-display-date');
    if (dateEl) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = today.toLocaleDateString('id-ID', options);
    }
}

function downloadCertificateSVG() {
    const nameInput = document.getElementById('cert-student-name');
    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Peserta Linux.Edu';
    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const serial = 'EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
    <!-- Vintage Background & Border Frames -->
    <rect width="900" height="600" fill="#F6F3EC" />
    <rect x="25" y="25" width="850" height="550" rx="8" fill="#FFFDF9" stroke="#DDD3C1" stroke-width="2" />
    <rect x="35" y="35" width="830" height="530" rx="6" fill="none" stroke="#B85D19" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6" />
    <rect x="42" y="42" width="816" height="516" rx="4" fill="none" stroke="#2B231D" stroke-width="0.8" opacity="0.3" />

    <!-- Header -->
    <text x="450" y="85" font-family="'JetBrains Mono', Courier, monospace" font-size="12" fill="#B85D19" font-weight="bold" letter-spacing="4" text-anchor="middle">LINUX.EDU — KURIKULUM DASAR TERBUKA</text>
    <text x="450" y="130" font-family="'Fraunces', Georgia, serif" font-size="28" fill="#2B231D" font-weight="bold" text-anchor="middle">SERTIFIKAT KELULUSAN</text>
    <text x="450" y="160" font-family="'Inter', Arial, sans-serif" font-size="12" fill="#63574B" text-anchor="middle">Diberikan sebagai pengakuan atas penguasaan fondasi arsitektur Linux &amp; terminal POSIX:</text>

    <!-- Student Name -->
    <text x="450" y="235" font-family="'Fraunces', Georgia, serif" font-size="34" fill="#B85D19" font-weight="bold" text-anchor="middle">${escapeHtml(name)}</text>
    <line x1="220" y1="252" x2="680" y2="252" stroke="#B85D19" stroke-width="1.5" />

    <!-- Curriculum modules -->
    <text x="450" y="295" font-family="'Inter', Arial, sans-serif" font-size="13" fill="#2B231D" font-weight="bold" text-anchor="middle">Telah menyelesaikan seluruh rangkaian modul kurikulum:</text>
    <text x="450" y="325" font-family="'JetBrains Mono', monospace" font-size="11" fill="#63574B" text-anchor="middle">1. Arsitektur Kernel • 2. Keamanan POSIX • 3. Silsilah Distro • 4. Sandbox CLI • 5. Setup Mandiri</text>

    <!-- Center Vintage Seal -->
    <circle cx="450" cy="425" r="34" fill="#EDE6DA" stroke="#B85D19" stroke-width="2"/>
    <circle cx="450" cy="425" r="28" fill="none" stroke="#DDD3C1" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="450" y="432" font-family="'Inter', sans-serif" font-size="22" text-anchor="middle">🐧</text>
    <text x="450" y="475" font-family="'JetBrains Mono', monospace" font-size="10" fill="#3E6548" font-weight="bold" letter-spacing="1" text-anchor="middle">VERIFIED COMPLETE</text>

    <!-- Footer Details -->
    <text x="90" y="525" font-family="'JetBrains Mono', monospace" font-size="10" fill="#88796B">TANGGAL PENYELESAIAN</text>
    <text x="90" y="545" font-family="'Inter', Arial, sans-serif" font-size="13" fill="#2B231D" font-weight="bold">${today}</text>

    <text x="810" y="525" font-family="'JetBrains Mono', monospace" font-size="10" fill="#88796B" text-anchor="end">KODE VERIFIKASI DOKUMEN</text>
    <text x="810" y="545" font-family="'JetBrains Mono', monospace" font-size="13" fill="#B85D19" font-weight="bold" text-anchor="end">${serial}</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sertifikat-LinuxEdu-${name.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Sertifikat berhasil diunduh dalam format SVG!');
}

// ==========================================
// 6.5. LOGOUT & AUTH NAVIGATION HANDLER
// ==========================================
function handleLogout() {
    if (confirm('Yakin ingin keluar dari LINUX.EDU?')) {
        sessionStorage.removeItem('linuxedu_auth');
        showToast('Berhasil keluar. Sampai jumpa!');
        setTimeout(() => {
            window.location.replace('login.html');
        }, 600);
    }
}

function initAuthNav() {
    const isAuth = sessionStorage.getItem('linuxedu_auth') === '1';

    // 1. Desktop slot
    const authNavSlot = document.getElementById('auth-nav-slot');
    if (authNavSlot) {
        if (isAuth) {
            authNavSlot.innerHTML = `
                <a href="login.html" title="Detail Akun" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-brand-border bg-brand-surface text-brand-ink font-mono text-xs hover:border-brand-amber transition-colors">
                    <i class="fa-solid fa-circle-user text-xs text-brand-green"></i>
                    <span class="font-bold">admin</span>
                </a>
                <button onclick="handleLogout()" title="Keluar dari akun" class="px-2 py-1.5 rounded-sm text-brand-muted hover:text-red-600 hover:bg-red-50 font-mono text-xs transition-colors flex items-center gap-1 border border-transparent hover:border-red-200">
                    <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                    <span class="hidden lg:inline">Keluar</span>
                </button>
            `;
        } else {
            authNavSlot.innerHTML = `
                <a href="login.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-amber text-white font-mono font-bold text-xs hover:bg-brand-ink transition-colors shadow-sm">
                    <i class="fa-solid fa-right-to-bracket text-[11px]"></i>
                    <span>Login</span>
                </a>
            `;
        }
    } else {
        // Fallback for header actions if slot not yet in static markup
        const actionsDiv = document.querySelector('header .flex.items-center.gap-2');
        if (actionsDiv) {
            const fallbackSlot = document.createElement('div');
            fallbackSlot.id = 'auth-nav-slot';
            fallbackSlot.className = 'flex items-center gap-1.5';
            if (isAuth) {
                fallbackSlot.innerHTML = `
                    <a href="login.html" title="Detail Akun" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-brand-border bg-brand-surface text-brand-ink font-mono text-xs hover:border-brand-amber transition-colors">
                        <i class="fa-solid fa-circle-user text-xs text-brand-green"></i>
                        <span class="font-bold">admin</span>
                    </a>
                    <button onclick="handleLogout()" title="Keluar dari akun" class="px-2 py-1.5 rounded-sm text-brand-muted hover:text-red-600 hover:bg-red-50 font-mono text-xs transition-colors flex items-center gap-1 border border-transparent hover:border-red-200">
                        <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                    </button>
                `;
            } else {
                fallbackSlot.innerHTML = `
                    <a href="login.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-amber text-white font-mono font-bold text-xs hover:bg-brand-ink transition-colors shadow-sm">
                        <i class="fa-solid fa-right-to-bracket text-[11px]"></i>
                        <span>Login</span>
                    </a>
                `;
            }
            actionsDiv.insertBefore(fallbackSlot, actionsDiv.firstChild);
        }
    }

    // 2. Mobile drawer slot
    const mobileAuthSlot = document.getElementById('mobile-auth-slot');
    if (mobileAuthSlot) {
        if (isAuth) {
            mobileAuthSlot.innerHTML = `
                <div class="space-y-1">
                    <a href="login.html" class="block px-3 py-2 rounded-sm text-brand-ink hover:bg-brand-card flex items-center justify-between">
                        <span class="flex items-center gap-2">
                            <i class="fa-solid fa-circle-user text-brand-green text-xs"></i>
                            <span>Akun: <strong>admin</strong></span>
                        </span>
                        <span class="text-[10px] text-brand-green bg-green-50 px-1.5 py-0.5 border border-green-200 uppercase font-bold">Aktif</span>
                    </a>
                    <button onclick="handleLogout()" class="w-full text-left block px-3 py-2 rounded-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                        <span>Keluar dari Akun</span>
                    </button>
                </div>
            `;
        } else {
            mobileAuthSlot.innerHTML = `
                <a href="login.html" class="block px-3 py-2 rounded-sm bg-brand-amber text-white font-bold flex items-center gap-2">
                    <i class="fa-solid fa-right-to-bracket text-[11px]"></i>
                    <span>Masuk / Login</span>
                </a>
            `;
        }
    } else {
        const drawer = document.getElementById('mobile-drawer');
        if (drawer) {
            const fallbackMobile = document.createElement('div');
            fallbackMobile.id = 'mobile-auth-slot';
            fallbackMobile.className = 'pt-2 mt-2 border-t border-brand-border';
            if (isAuth) {
                fallbackMobile.innerHTML = `
                    <div class="space-y-1">
                        <a href="login.html" class="block px-3 py-2 rounded-sm text-brand-ink hover:bg-brand-card flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <i class="fa-solid fa-circle-user text-brand-green text-xs"></i>
                                <span>Akun: <strong>admin</strong></span>
                            </span>
                            <span class="text-[10px] text-brand-green bg-green-50 px-1.5 py-0.5 border border-green-200 uppercase font-bold">Aktif</span>
                        </a>
                        <button onclick="handleLogout()" class="w-full text-left block px-3 py-2 rounded-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                            <span>Keluar dari Akun</span>
                        </button>
                    </div>
                `;
            } else {
                fallbackMobile.innerHTML = `
                    <a href="login.html" class="block px-3 py-2 rounded-sm bg-brand-amber text-white font-bold flex items-center gap-2">
                        <i class="fa-solid fa-right-to-bracket text-[11px]"></i>
                        <span>Masuk / Login</span>
                    </a>
                `;
            }
            drawer.appendChild(fallbackMobile);
        }
    }
}

// ==========================================
// 7. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Auth Navigation
    initAuthNav();

    // 1. Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileBtn && mobileDrawer) {
        mobileBtn.addEventListener('click', () => {
            mobileDrawer.classList.toggle('hidden');
        });
    }

    // 2. Terminal input keyboard navigation
    const cliInput = document.getElementById('cli-input');
    if (cliInput) {
        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (VirtualFS.historyIndex > 0) {
                    VirtualFS.historyIndex--;
                    cliInput.value = VirtualFS.history[VirtualFS.historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (VirtualFS.historyIndex < VirtualFS.history.length - 1) {
                    VirtualFS.historyIndex++;
                    cliInput.value = VirtualFS.history[VirtualFS.historyIndex] || '';
                } else {
                    VirtualFS.historyIndex = VirtualFS.history.length;
                    cliInput.value = '';
                }
            }
        });
    }

    // 3. Current page automatic tracker registration
    const pageId = document.body.dataset.moduleId;
    if (pageId) {
        LinuxEduTracker.markVisited(pageId);
    } else {
        LinuxEduTracker.renderRoadmapBadges();
    }

    // 4. If distros page, load all
    if (document.getElementById('distros-grid-container')) {
        filterDistros('all');
    }

    // 5. If certificate page, initialize date
    if (document.getElementById('cert-student-name')) {
        updateCertificatePreview();
    }
});
