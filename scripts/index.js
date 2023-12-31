"use strict";

const resultWrapper = document.getElementById("result-wrapper");
const detailsWrapper = document.getElementById("id-details-wrapper");
const searchInput = document.getElementById("search");
const searchTrendSpan = document.getElementById("search-trend");
const pageNumberSpan = document.getElementById("page-number");
const nextBtn = document.getElementById("next-btn");

let SEARCH_DEBOUNCE_FLAG = null;
let CURRENT_PAGE = 1;

window.onload = () => document.body.classList.add("loaded");

document.addEventListener("DOMContentLoaded", () => {
    if (!resultWrapper) throw new Error("Result wrapper is not exist");
    if (!detailsWrapper) throw new Error("Details wrapper is not exist");
    initialMovieList();
    initListeners();
});

window.onresize = calcItemsSize;

function initialMovieList() {
    getMovies("Cozmo")
        .then(({ movies = [], totalResult = 0 }) => movies.forEach(generateMovieItem));
}

function initListeners() {
    detailsWrapper.querySelector(".movie-details__close")
        .addEventListener("click", closeDetailsSection);
    searchInput.addEventListener("input", searchInMovies);
    nextBtn.addEventListener("click", nextBtnClickHandler);
}

function searchInMovies(e) {
    if (SEARCH_DEBOUNCE_FLAG) clearTimeout(SEARCH_DEBOUNCE_FLAG);
    SEARCH_DEBOUNCE_FLAG = setTimeout(() => {
        let trend = e.target.value || "Cozmo";
        if (trend.length < 3) return;
        CURRENT_PAGE = 1;
        trend = trend.trim();
        getMoviesAndParse(trend, CURRENT_PAGE);
    }, 300);
}

function nextBtnClickHandler() {
    let trend = searchInput.value || "Cozmo";
    if (trend.length < 3) return;
    getMoviesAndParse(trend, ++CURRENT_PAGE);
}

function getMoviesAndParse(trend, page) {
    resultWrapper.innerHTML = '';
    searchTrendSpan.innerText = trend.length < 10 ? trend : `${trend.substr(0, 8)}...`;
    nextBtn.style.display = "none";
    pageNumberSpan.innerText = '';

    getMovies(trend, page)
        .then(({ movies = [], totalResults = 0 }) => {
            if ((page * 10) < +totalResults) {
                pageNumberSpan.innerText = `| Page: ${page}`;
                nextBtn.style.display = "inline-block";
            }

            if (movies.length)
                movies.forEach(generateMovieItem);
            else
                generateNoContentPlaceholder();

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
}

function generateMovieItem(item) {
    const movieElm = document.createElement("div");
    movieElm.dataset.imdbid = item.imdbID;
    movieElm.classList.add("movie-item");

    movieElm.addEventListener("click", handleMovieItemClick);

    movieElm.innerHTML = `
        <figure class="movie-item__poster"
            style="background-image: url('${item.Poster}')"></figure>
        <h2 class="movie-item__title">${item.Title}</h2>
        <div class="movie-item__meta">
            <span class="movie-item__meta__year">${item.Year}</span>
            <span class="movie-item__meta__divider">&nbsp;-&nbsp;</span>
            <span class="movie-item__meta__imdb-link">
                <a href="https://www.imdb.com/title/${item.imdbID}" target="_blank">IMDB</a></span>
        </div>`;

    resultWrapper.append(movieElm);
}

function generateNoContentPlaceholder() {
    const placeholderElm = document.createElement("p");
    placeholderElm.classList.add("no-content-placeholder");
    placeholderElm.innerText = `Movies not found.`;
    resultWrapper.append(placeholderElm);
}

function handleMovieItemClick(e) {
    const movieItem = e.target.closest(".movie-item");
    const movieItemID = movieItem.dataset.imdbid;

    removeDetailsClassFromItems();
    movieItem.classList.add("--in-details");

    getSingleMovie(movieItemID)
        .then(movieObj => showMovieInDetails(movieObj, movieItem));
}

function calcItemsSize() {
    const columnsCount = Math.floor(resultWrapper.offsetWidth / 200) || 1;
    document.body.style.setProperty("--poster-height", `${resultWrapper.offsetWidth / columnsCount}px`);
    document.body.style.setProperty("--result-grid-column", columnsCount.toString());
}

function removeDetailsClassFromItems() {
    document.querySelectorAll(".movie-item").forEach(mi => mi.classList.remove("--in-details"));
}

function closeDetailsSection() {
    detailsWrapper.classList.remove("--visible");
    removeDetailsClassFromItems();
    calcItemsSize();
}

function showMovieInDetails(movieObj, targetItem) {
    if (!detailsWrapper.classList.contains("--visible"))
        detailsWrapper.classList.add("--visible");

    calcItemsSize();

    setTimeout(() => {
        window.scrollTo({ top: targetItem.offsetTop - 20, behavior: 'smooth' });
    }, 50);

    let detailsElm = detailsWrapper.querySelector(".movie-details__inner");
    if (!detailsElm)
        detailsElm = document.createElement("div");

    detailsElm.classList.add("movie-details__inner");

    if (!movieObj.Poster || movieObj.Poster === "N/A")
        detailsElm.classList.add("--no-poster");
    else
        detailsElm.classList.remove("--no-poster");

    detailsElm.innerHTML = `
        <span class="loader"></span>
        <figure class="movie-details__poster"
            style="background-image: url('${movieObj.Poster}')"></figure>
        <div class="movie-details__title">
            <h2>${movieObj.Title}</h2>
            <span class="movie-details__rating">${movieObj.imdbRating} / 10</span>
        </div>
        <div class="movie-details__meta">
            <span><span class="--label">Released:</span>${movieObj.Released}</span>&nbsp;-&nbsp;
            <span><span class="--label">Runtime:</span>${movieObj.Runtime}</span>
        </div>
        <div class="movie-details__meta"><span class="--label">Genre:</span>${movieObj.Genre}</div>
        <div class="movie-details__meta">
            <span><span class="--label">Director:</span>${movieObj.Director}</span>&nbsp;-&nbsp;
            <span><span class="--label">Writer:</span>${movieObj.Writer}</span>
        </div>
        <div class="movie-details__meta">
            <span><span class="--label">Country:</span>${movieObj.Country}</span>&nbsp;-&nbsp;
            <span><span class="--label">Language:</span>${movieObj.Language}</span>
        </div>
        <div class="movie-details__meta">
            <span class="--label">Actors:</span>${movieObj.Actors}
        </div>
        <div class="movie-details__meta">
            <span class="--label">Summary:</span>
            <p>Action ,Romance,Comedy,thiller,fear..etc.</p>
        </div>`;

    detailsWrapper.append(detailsElm);
}
