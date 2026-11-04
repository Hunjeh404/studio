// 한 팀은 한 동물: KT 고양이, 삼성 숫사자 (studio/public/chars 캐릭터)
export const TEAM_ANIMAL={KT:'cat',SS:'lion'};
export const animalOf=key=>TEAM_ANIMAL[key.split(':')[0]]??'cat';
