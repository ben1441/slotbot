import Axios from "axios";

export const getUserBalance = async (initData) => {
  try {
    // const res = await Axios.post('',{initData})
    // if (res.data.ok) {
    const balance = 100;
    return { balance, ok: true };
    // }
    // return { ok: false }
  } catch (error) {
    console.log(error);
    return { ok: false };
  }
};

export const getSlotResult = async () => {
  // const res = await Axios.get('');
  // if (res.data.ok) {
  //     const {ok,slotImages,isWIn} = res.data
  //     return { slotImages, ok: true,isWin }
  // }
  return new Promise((resolve) => {
    setTimeout(() => {
      let slots = [237, 79, 0, 158];
      let spn = [
        slots[Math.floor(Math.random() * 4)],
        slots[Math.floor(Math.random() * 4)],
        slots[Math.floor(Math.random() * 4)],
      ];
      console.log(spn);
      const slotImages = [spn[0], spn[1], spn[2]];
      resolve({ slotImages, isWin: (spn[0] == spn[1]) == spn[2], ok: true });
    }, 500);
  });
};
