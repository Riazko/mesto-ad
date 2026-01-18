import {
  getCardList,
  getUserInfo,
  setUserInfo,
  setUserAvatar,
  getNewCard,
  deleteCard,
  changeLikeCardStatus,
} from "./components/api.js";

import { createCardElement } from "./components/card.js";
//asdasd
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";

import { enableValidation, clearValidation } from "./components/validation.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

const placesWrap = document.querySelector(".places__list");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info"); // dl
const cardInfoModalUsersList = cardInfoModalWindow.querySelector(".popup__list"); // ul

const infoDefinitionTemplate = document.querySelector(
  "#popup-info-definition-template"
).content;

const infoUserPreviewTemplate = document.querySelector(
  "#popup-info-user-preview-template"
).content;

let currentUserId = null;

const setButtonLoading = (button, isLoading, loadingText) => {
  if (!button) return;
  if (isLoading) {
    button.dataset.defaultText = button.textContent;
    button.textContent = loadingText;
  } else {
    button.textContent = button.dataset.defaultText || button.textContent;
    delete button.dataset.defaultText;
  }
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (label, value) => {
  const item = infoDefinitionTemplate
    .querySelector(".popup__info-item")
    .cloneNode(true);

  const term = item.querySelector(".popup__info-term");
  const description = item.querySelector(".popup__info-description");

  term.textContent = label;
  description.textContent = value;

  const fragment = document.createDocumentFragment();
  fragment.append(term, description);
  return fragment;
};

const createUserPreview = (user) => {
  const item = infoUserPreviewTemplate
    .querySelector(".popup__list-item")
    .cloneNode(true);

  item.textContent = user.name;
  return item;
};

const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((c) => c._id === cardId);
      if (!cardData) return;

      cardInfoTitle.textContent = "Информация о карточке";
      cardInfoText.textContent = "Лайкнули:";

      cardInfoModalInfoList.innerHTML = "";
      cardInfoModalUsersList.innerHTML = "";

      cardInfoModalInfoList.append(
        createInfoString("Описание:", cardData.name),
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        ),
        createInfoString("Владелец:", cardData.owner?.name || "—"),
        createInfoString(
          "Количество лайков:",
          String(cardData.likes?.length ?? 0)
        )
      );

      (cardData.likes || []).forEach((user) => {
        cardInfoModalUsersList.append(createUserPreview(user));
      });

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => console.log(err));
};

const renderCard = (cardData) => {
  const cardElement = createCardElement(cardData, {
    onPreviewPicture: handlePreviewPicture,

    onLikeIcon: (likeButton) => {
      const likeCountEl = cardElement.querySelector(".card__like-count");
      const isLikedNow = likeButton.classList.contains(
        "card__like-button_is-active"
      );

      changeLikeCardStatus(cardData._id, isLikedNow)
        .then((updatedCard) => {
          const isLikedByMe = updatedCard.likes.some(
            (u) => u._id === currentUserId
          );

          likeButton.classList.toggle(
            "card__like-button_is-active",
            isLikedByMe
          );

          if (likeCountEl) likeCountEl.textContent = updatedCard.likes.length;

          cardData.likes = updatedCard.likes;
        })
        .catch((err) => console.log(err));
    },

    onDeleteCard: () => {
      const deleteBtn = cardElement.querySelector(
        ".card__control-button_type_delete"
      );
      const defaultText = deleteBtn ? deleteBtn.textContent : "";

      if (deleteBtn) deleteBtn.textContent = "Удаление...";

      deleteCard(cardData._id)
        .then(() => {
          cardElement.remove();
        })
        .catch((err) => console.log(err))
        .finally(() => {
          if (deleteBtn) deleteBtn.textContent = defaultText;
        });
    },
  });

  if (cardData.owner?._id !== currentUserId) {
    const deleteBtn = cardElement.querySelector(
      ".card__control-button_type_delete"
    );
    if (deleteBtn) deleteBtn.remove();
  }

  const likeCountEl = cardElement.querySelector(".card__like-count");
  if (likeCountEl) {
    likeCountEl.textContent = Array.isArray(cardData.likes)
      ? cardData.likes.length
      : 0;
  }

  const likeButton = cardElement.querySelector(".card__like-button");
  if (likeButton && Array.isArray(cardData.likes)) {
    const isLikedByMe = cardData.likes.some((u) => u._id === currentUserId);
    likeButton.classList.toggle("card__like-button_is-active", isLikedByMe);
  }

  const infoBtn = cardElement.querySelector(".card__control-button_type_info");
  if (infoBtn) {
    infoBtn.addEventListener("click", () => handleInfoClick(cardData._id));
  }

  return cardElement;
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  setButtonLoading(submitButton, true, "Сохранение...");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => setButtonLoading(submitButton, false));
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  setButtonLoading(submitButton, true, "Сохранение...");

  setUserAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => setButtonLoading(submitButton, false));
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  setButtonLoading(submitButton, true, "Создание...");

  getNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((card) => {
      placesWrap.prepend(renderCard(card));
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => setButtonLoading(submitButton, false));
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

document.querySelectorAll(".popup").forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;

    cards.forEach((cardData) => {
      placesWrap.append(renderCard(cardData));
    });

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
  })
  .catch((err) => console.log(err));
