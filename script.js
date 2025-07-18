// Global variables to manage audio playback and song data
let currentSong = new Audio();
let songs = [];
let currFolder;
let currentSongIndex = 0;

function secondsToMinutesSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        // Changed path for GitHub Pages
        const a = await fetch(`${window.location.pathname}${folder}/info.json`);
        if (!a.ok) throw new Error(`Failed to load info.json for ${folder}`);
        const response = await a.json();
        songs = response.songs;
    } catch (err) {
        console.error("Error getting songs:", err);
        songs = [];
        return;
    }

    let songsUL = document.querySelector(".songslist ul");
    songsUL.innerHTML = "";
    for (const songData of songs) {
        const displayName = songData.name || decodeURIComponent(songData.filename.replace(".mp3", ""));
        songsUL.innerHTML += `
            <li>
                <img class="invert" src="${window.location.pathname}Images/Svg's/music.svg" alt="">
                <div class="info"><div class="multicolor-text">${displayName}</div></div>
                <img class="invert" src="${window.location.pathname}Images/Svg's/play.svg" alt="">
            </li>`;
    }

    Array.from(songsUL.getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index].filename, false, index);
        });
    });

    return songs;
}

const playMusic = (track, pause = false, index = null) => {
    // Modified path for GitHub Pages
    currentSong.src = `${window.location.pathname}${currFolder}/` + track;
    if (index !== null) currentSongIndex = index;

    if (!pause) {
        currentSong.play().then(() => {
            document.getElementById("play").src = `${window.location.pathname}Images/Svg's/pause.svg`;
        }).catch(error => {
            if (error.name !== "AbortError") console.error("Play error:", error);
        });
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track.replace(".mp3", ""));
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    let albumsData;
    try {
        // Changed path for GitHub Pages
        const a = await fetch(`${window.location.pathname}data.json`);
        if (!a.ok) throw new Error("Failed to load album data.json");
        albumsData = await a.json();
    } catch (err) {
        console.error("Error loading albums:", err);
        return;
    }

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const album of albumsData.albums) {
        const { folder, title, description } = album;
        cardContainer.innerHTML += `
            <div data-folder="songs/${folder}" class="card">
                <div class="play">
                    <svg width="18" height="18" viewBox="-1 0.5 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="${window.location.pathname}songs/${folder}/cover.jpg" alt="${title} cover">
                <h2>${title}</h2>
                <p>${description}</p>
            </div>`;
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder.split('/')[1]}`);
            if (songs && songs.length > 0) {
                playMusic(songs[0].filename, false, 0);
            }

            if (window.innerWidth <= 1000) {
                document.querySelector(".left").style.left = "0";
            }
        });
    });
}

async function main() {
    // Changed default path for GitHub Pages
    await getSongs("songs/ncs");
    if (songs && songs.length > 0) {
        playMusic(songs[0].filename, true, 0);
    }

    displayAlbums();

    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = `${window.location.pathname}Images/Svg's/pause.svg`;
        } else {
            currentSong.pause();
            play.src = `${window.location.pathname}Images/Svg's/play.svg`;
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
    });

    currentSong.addEventListener("ended", () => {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex].filename, false, currentSongIndex);
    });

    document.body.onkeydown = e => {
        if (e.code === "Space") {
            e.preventDefault();
            play.click();
        }
        if (e.code === "ArrowRight") next.click();
        if (e.code === "ArrowLeft") previous.click();
    };
}

main();
