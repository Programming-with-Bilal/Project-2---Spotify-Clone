// Global variables to manage audio playback and song data
let currentSong = new Audio(); // Audio object for current playing song
let songs = []; // Array to store song data for current playlist
let currFolder; // Current folder path containing songs
let currentSongIndex = 0; // Index of currently playing song in songs array
let currentlyPlayingLi = null;

function createWaveAnimation() {
    return `<div class="wave-animation">
        <div class="bar"></div><div class="bar"></div><div class="bar"></div>
        <div class="bar"></div><div class="bar"></div>
    </div>`;
}

function updatePlayIcons() {
    document.querySelectorAll(".songslist ul li").forEach((item, index) => {
        const playIcon = item.querySelector("img:last-child");
        const waveAnim = item.querySelector(".wave-animation");

        // Always clean up first
        if (waveAnim) waveAnim.remove();
        // playIcon.style.display = "block";
        if (playIcon) playIcon.style.display = "block";

        // Only show wave for currently playing AND not paused
        if (index === currentSongIndex && !currentSong.paused) {
            playIcon.style.display = "none";
            item.insertAdjacentHTML("beforeend", createWaveAnimation());
        }
    });
}

/**
 * Converts seconds to MM:SS format :
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string (MM:SS)
 */
function secondsToMinutesSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00"; // Return default for invalid input
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    // Pad with leading zeros for consistent formatting
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Fetches and displays songs from a specified folder
 * @param {string} folder - Path to folder containing songs
 * @returns {Promise} Promise resolving to songs array
 */
async function getSongs(folder) {
    currFolder = folder;
    try {
        // Fetch song metadata from info.json :
        const a = await fetch(`${folder}/info.json`);
        if (!a.ok) throw new Error(`Failed to load info.json for ${folder}`);
        const response = await a.json();
        songs = response.songs; // Store song data
    } catch (err) {
        console.error("Error getting songs:", err);
        songs = []; // Reset songs array on error
        return;
    }

    // Update song list in UI
    let songsUL = document.querySelector(".songslist ul");
    songsUL.innerHTML = "";
    for (const songData of songs) {
        // Use display name if available, otherwise generate from filename
        const displayName = songData.name || decodeURIComponent(songData.filename.replace(".mp3", ""));
        songsUL.innerHTML += `
            <li>
                <img class="invert" src="Images/Svg's/music.svg" alt="">
                <div class="info"><div class="multicolor-text">${displayName}</div></div>
                <img class="invert" src="Images/Svg's/play.svg" alt="">
            </li>`;
    }

    // Add click handlers to each song list item
    Array.from(songsUL.getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index].filename, false, index);
        });
    });

    return songs;
}

/**
 * Plays a specified audio track
 * @param {string} track - Filename of track to play
 * @param {boolean} pause - Whether to start paused
 * @param {number} index - Index of song in songs array
 */

let currentPlayPromise = null; // track latest play() call

const playMusic = async (track, pause = false, index = null) => {
    if (currentlyPlayingLi) {
        const prevPlayIcon = currentlyPlayingLi.querySelector("img:last-child");
        const waveAnim = currentlyPlayingLi.querySelector(".wave-animation");
        if (waveAnim) waveAnim.remove();
        if (prevPlayIcon) prevPlayIcon.style.display = "block";
    }

    currentSong.pause(); // pause before changing src
    // currentSong.src = `${currFolder}/` + track;
    currentSong.src = `${currFolder}/` + encodeURIComponent(track);

    if (index !== null) currentSongIndex = index;

    const songItems = document.querySelectorAll(".songslist ul li");
    if (songItems.length > currentSongIndex) {
        currentlyPlayingLi = songItems[currentSongIndex];
        updatePlayIcons();
    }

    if (!pause) {
        try {
            // Cancel any previous play promise
            if (currentPlayPromise) {
                await currentPlayPromise.catch(() => { });
            }

            // Safely try to play new song
            currentPlayPromise = currentSong.play();
            await currentPlayPromise;

            play.src = "Images/Svg's/pause.svg";
            updatePlayIcons();
        } catch (err) {
            if (err.name === "AbortError") {
            } else {
                console.error("Playback error:", err);
            }
        }
    } else {
        play.src = "Images/Svg's/play.svg";
        updatePlayIcons();
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track.replace(".mp3", ""));
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

/**
 * Displays album cards from data.json
 */
async function displayAlbums() {
    let albumsData;
    try {
        // Fetch album data
        const a = await fetch(`data.json`);
        if (!a.ok) throw new Error("Failed to load album data.json");
        albumsData = await a.json();
    } catch (err) {
        alert("Could not load albums: " + err.message);
        console.error("Error loading albums:", err);
        return;
    }

    // Clear and repopulate album cards
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const album of albumsData.albums) {
        const { folder, title, description } = album;
        cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="18" height="18" viewBox="-1 0.5 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="songs/${folder}/cover.jpg" alt="${title} cover">
                <h2>${title}</h2>
                <p>${description}</p>
            </div>`;
    }

    // Add click handlers to album cards
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs && songs.length > 0) {
                playMusic(songs[0].filename, false, 0);
            }

            // Show sidebar on mobile
            if (window.innerWidth <= 1000) {
                document.querySelector(".left").style.left = "0";
            }
        });
    });
}

/**
 * Main initialization function :
 */
async function main() {
    // Initialize with default songs
    await getSongs("songs/ncs");
    if (songs && songs.length > 0) {
        playMusic(songs[0].filename, true, 0);
    }

    // Display all albums
    displayAlbums();

    // Play/Pause button handler :

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "Images/Svg's/pause.svg";
            updatePlayIcons(currentSongIndex);
        } else {
            currentSong.pause();
            play.src = "Images/Svg's/play.svg";
            updatePlayIcons(currentSongIndex); // This will now show play icon
        }
    });

    // Update progress bar during playback :

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar click handler :

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Mobile menu handlers :

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous track handler :

    previous.addEventListener("click", () => {
        currentSong.pause();
        // Circular navigation through playlist
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
    });

    // Next track handler :

    next.addEventListener("click", () => {
        currentSong.pause();
        // Circular navigation through playlist
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
    });

    // Auto-play next song when current ends :

    currentSong.addEventListener("ended", () => {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
        updatePlayIcons(currentSongIndex);
    });

    // Keyboard controls :

    document.body.onkeydown = e => {
        if (e.code === "Space") {
            e.preventDefault();
            play.click();
        }
        if (e.code === "ArrowRight") {
            e.preventDefault();
            currentSong.pause();
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
        }
        if (e.code === "ArrowLeft") {
            e.preventDefault();
            currentSong.pause();
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
        }
    };
}

// Start the application :
main();
