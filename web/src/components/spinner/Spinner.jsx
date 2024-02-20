import "./Spinner.scss";
import { useState, useRef, useEffect } from "react";
import Lottie from "react-lottie";
import winner from "../../../public/animation/winner.json";
import coin from "../../../public/animation/coin.json";
import { getSlotResult, getUserBalance } from "../../api/api";
import Loader from "../loader/Loader.jsx";
import Notfound from "../notfound/NotFound.jsx";
import CryptoJS from "crypto-js";

const Spinner = () => {
  const [isWinner, setisWinner] = useState(false);
  const [isLoser, setisLoser] = useState(false);
  const [amount, setAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const editableRef = useRef(null);
  const [indexes, setIndexes] = useState([0, 0, 0]);
  const [balance, setBalance] = useState(10);
  const [spinningAudio, setSpinningAudio] = useState(false);
  const [spinner, setSpinner] = useState(true);
  const [unverifiedUser, setUnverifiedUser] = useState(false);

  const icon_height = 79,
    num_icons = 4,
    time_per_icon = 100;
  const winnerOptions = {
    loop: true,
    autoplay: true,
    animationData: winner,
  };

  const roll = async (reel, offset = 0) => {
    setSpinningAudio(true);
    const delta =
      (offset + 6) * num_icons + Math.round(Math.random() * num_icons);
    let backgroundPositionY,
      targetBackgroundPositionY,
      normTargetBackgroundPositionY;
    let { isWin, slotImages, ok } = await getSlotResult();

    // cherry 237
    // green apple 79
    // banana 0
    // orange 158
    if (isWin) {
      backgroundPositionY = offset === 0 ? 158 : offset === 1 ? 237 : 0;
      targetBackgroundPositionY =
        offset === 0 ? 2133 : offset === 1 ? 2449 : 2700;
      normTargetBackgroundPositionY = slotImages[0];
    } else {
      const style = getComputedStyle(reel);
      backgroundPositionY = parseFloat(style["background-position-y"]);
      normTargetBackgroundPositionY = slotImages[offset];
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reel.style.transition = `background-position-y ${
          (8 + 1 * delta) * time_per_icon
        }ms cubic-bezier(.62,.22,.59,3.33)`;
        reel.style.backgroundPositionY = `${
          backgroundPositionY + delta * icon_height
        }px`;
      }, offset * 150);

      setTimeout(() => {
        reel.style.transition = `none`;
        reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
        console.log(delta);
        if (isWin) {
          resolve(3);
        } else {
          resolve(offset);
        }
      }, (8 + 1 * delta) * time_per_icon + offset * 6);
    });
  };

  const rollAll = () => {
    if (amount <= 0) return window.alert("Enter a valid amount");
    if (balance < amount) return window.alert("Insufficient Balance");
    setIsSpinning(true);
    const reelsList = document.querySelectorAll(".slots > .reel");
    Promise.all([...reelsList].map((reel, i) => roll(reel, i))).then(
      (deltas) => {
        setIndexes((prevIndexes) =>
          prevIndexes.map((value, i) => (value + deltas[i]) % num_icons)
        );
        const updatedIndexes = indexes.map(
          (value, i) => (value + deltas[i]) % num_icons
        );
        console.log(updatedIndexes);
        if (new Set(updatedIndexes).size === 1) {
          setSpinningAudio(false);
          setisWinner(true);
          setBalance((prevBalance) => parseInt(prevBalance) + parseInt(amount));
          setTimeout(() => {
            setisWinner(false);
            setIsSpinning(false);
          }, 5000);
        } else {
          setSpinningAudio(false);
          setBalance((prevBalance) => prevBalance - amount);
          setTimeout(() => {
            setisLoser(true);
            setTimeout(() => {
              setIsSpinning(false);
              setisLoser(false);
            }, 2000);
          }, 500);
        }
      }
    );
  };

  useEffect(() => {
    if (spinningAudio) {
      const audio = new Audio("/audio/spinning.mp3");
      audio.play();
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [spinningAudio]);

  useEffect(() => {
    if (isLoser) {
      const loserAudio = new Audio("/audio/loser.mp3");
      loserAudio.play();
      return () => {
        loserAudio.pause();
        loserAudio.currentTime = 0;
      };
    }
  }, [isLoser]);

  useEffect(() => {
    if (isWinner) {
      const winnerAudio = new Audio("/audio/winner.mp3");
      winnerAudio.play();

      return () => {
        winnerAudio.pause();
        winnerAudio.currentTime = 0;
      };
    }
  }, [isWinner]);

  const handleIncrement = () => {
    setAmount((prevCount) => prevCount + 1);
  };

  const handleDecrement = () => {
    setAmount((prevCount) => Math.max(prevCount - 1, 1));
  };

  const handleTextClick = () => {
    if (editableRef.current) {
      editableRef.current.focus();
    }
  };

  const handleTextBlur = (event) => {
    const newValue = event.target.textContent.trim();
    setAmount(parseInt(newValue, 10) || 0);
  };

  const handleTextChange = (event) => {
    const rawText = event.target.textContent;
    const numericText = rawText.replace(/[^0-9]/g, "");
    const newValue = parseInt(numericText, 10) || 0;
    event.target.textContent = numericText;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(event.target);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    setAmount(newValue);
  };

  useEffect(() => {
    setTimeout(async () => {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        const isValid = await validateInitData(
          initData,
          import.meta.env.VITE_BOT_TOKEN
        );
        if (isValid) {
          const { balance, ok } = await getUserBalance(initData);
          if (ok) {
            setBalance(balance);
          }
          setSpinner(false);
          return;
        } else {
          setSpinner(false);
          // setUnverifiedUser(true);
        }
        setSpinner(false);
        // setUnverifiedUser(true);
      }
      setSpinner(false);
      // setUnverifiedUser(true);
    }, 100);
  }, []);

  async function validateInitData(telegramInitData, botToken) {
    const initData = new URLSearchParams(telegramInitData);
    let dataToCheck = [];
    initData.sort();
    initData.forEach(
      (val, key) => key !== "hash" && dataToCheck.push(`${key}=${val}`)
    );
    const secret = CryptoJS.HmacSHA256(botToken, "WebAppData");
    const _hash = CryptoJS.HmacSHA256(dataToCheck.join("\n"), secret).toString(
      CryptoJS.enc.Hex
    );
    return _hash === initData.get("hash");
  }

  const coinOptions = {
    loop: true,
    autoplay: true,
    animationData: coin,
  };

  return (
    <>
      {spinner ? (
        <Loader />
      ) : unverifiedUser ? (
        <Notfound />
      ) : (
        <div className="slots-container">
          <img src="/images/spin2win.png" alt="" />
          <div className="slots">
            {Array(3)
              .fill()
              .map((_, index) => (
                <div
                  key={index}
                  className={`reel ${isWinner ? "blink" : ""}`}
                ></div>
              ))}
          </div>

          <div className="amount-container">
            <button onClick={handleDecrement}>-</button>
            <h4
              ref={editableRef}
              onClick={handleTextClick}
              onBlur={handleTextBlur}
              contentEditable="true"
              onInput={handleTextChange}
            >
              {amount}
            </h4>
            <button onClick={handleIncrement}>+</button>
          </div>

          <button
            className="spinBtn"
            disabled={isSpinning || isWinner || isLoser}
            onClick={rollAll}
          >
            {isSpinning ? <div className="spinning"></div> : "SPIN"}
          </button>

          {isWinner && (
            <div className="winner">
              <Lottie options={winnerOptions} />
            </div>
          )}

          <div className="balance">
            <h4>{balance}</h4>
            <h2>
              <Lottie options={coinOptions} />
            </h2>
          </div>
        </div>
      )}
    </>
  );
};

export default Spinner;
