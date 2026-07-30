const audio = document.getElementById("main-audio");
const playBtn = document.getElementById("play-btn");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const statusTag = document.getElementById("audio-status");
const timeDisplay = document.getElementById("time-display");
const footer = document.getElementById("audio-footer");

let hasStarted = false;

function togglePlay() {
  if (audio.paused) {
    audio.play();
    playBtn.innerText = "[ ❚❚ PAUSE ]";
    statusTag.innerText = "[ ▶ PLAYING]";
    statusTag.style.color = "#4ade80";
    footer.innerText = "STATUS: PLAYING";
  } else {
    audio.pause();
    playBtn.innerText = "[ ▶ PLAY ]";
    statusTag.innerText = "[PAUSED]";
    statusTag.style.color = "#c084fc";
    footer.innerText = "STATUS: PAUSED ⏸";
  }
}

playBtn.addEventListener("click", togglePlay);

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = percent + "%";

  const mins = Math.floor(audio.currentTime / 60);
  const secs = Math.floor(audio.currentTime % 60);
  const formattedMins = String(mins).padStart(2, "0");
  const formattedSecs = String(secs).padStart(2, "0");

  timeDisplay.innerText = formattedMins + ":" + formattedSecs;
});

progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  if (audio.duration) {
    audio.currentTime = (clickX / width) * audio.duration;
  }
});

document.addEventListener(
  "click",
  () => {
    if (!hasStarted) {
      audio
        .play()
        .then(() => {
          playBtn.innerText = "[ ❚❚ PAUSE ]";
          statusTag.innerText = "[ ▶ PLAYING]";
          statusTag.style.color = "#4ade80";
          footer.innerText = "PLAYING";
          hasStarted = true;
        })
        .catch(() => {});
    }
  },
  { once: true },
);
