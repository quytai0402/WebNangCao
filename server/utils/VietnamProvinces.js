// Dữ liệu tỉnh thành của Việt Nam
const provinces = [
  {
    "code": "01",
    "name": "Hà Nội",
    "division_type": "thành phố trung ương",
    "codename": "thanh_pho_ha_noi",
    "phone_code": "24"
  },
  {
    "code": "02",
    "name": "Hà Giang",
    "division_type": "tỉnh",
    "codename": "tinh_ha_giang",
    "phone_code": "219"
  },
  {
    "code": "04",
    "name": "Cao Bằng",
    "division_type": "tỉnh",
    "codename": "tinh_cao_bang",
    "phone_code": "206"
  },
  {
    "code": "06",
    "name": "Bắc Kạn",
    "division_type": "tỉnh",
    "codename": "tinh_bac_kan",
    "phone_code": "209"
  },
  {
    "code": "08",
    "name": "Tuyên Quang",
    "division_type": "tỉnh",
    "codename": "tinh_tuyen_quang",
    "phone_code": "207"
  },
  {
    "code": "10",
    "name": "Lào Cai",
    "division_type": "tỉnh",
    "codename": "tinh_lao_cai",
    "phone_code": "214"
  },
  {
    "code": "11",
    "name": "Điện Biên",
    "division_type": "tỉnh",
    "codename": "tinh_dien_bien",
    "phone_code": "215"
  },
  {
    "code": "12",
    "name": "Lai Châu",
    "division_type": "tỉnh",
    "codename": "tinh_lai_chau",
    "phone_code": "213"
  },
  {
    "code": "14",
    "name": "Sơn La",
    "division_type": "tỉnh",
    "codename": "tinh_son_la",
    "phone_code": "212"
  },
  {
    "code": "15",
    "name": "Yên Bái",
    "division_type": "tỉnh",
    "codename": "tinh_yen_bai",
    "phone_code": "216"
  },
  {
    "code": "17",
    "name": "Hoà Bình",
    "division_type": "tỉnh",
    "codename": "tinh_hoa_binh",
    "phone_code": "218"
  },
  {
    "code": "19",
    "name": "Thái Nguyên",
    "division_type": "tỉnh",
    "codename": "tinh_thai_nguyen",
    "phone_code": "208"
  },
  {
    "code": "20",
    "name": "Lạng Sơn",
    "division_type": "tỉnh",
    "codename": "tinh_lang_son",
    "phone_code": "205"
  },
  {
    "code": "22",
    "name": "Quảng Ninh",
    "division_type": "tỉnh",
    "codename": "tinh_quang_ninh",
    "phone_code": "203"
  },
  {
    "code": "24",
    "name": "Bắc Giang",
    "division_type": "tỉnh",
    "codename": "tinh_bac_giang",
    "phone_code": "204"
  },
  {
    "code": "25",
    "name": "Phú Thọ",
    "division_type": "tỉnh",
    "codename": "tinh_phu_tho",
    "phone_code": "210"
  },
  {
    "code": "26",
    "name": "Vĩnh Phúc",
    "division_type": "tỉnh",
    "codename": "tinh_vinh_phuc",
    "phone_code": "211"
  },
  {
    "code": "27",
    "name": "Bắc Ninh",
    "division_type": "tỉnh",
    "codename": "tinh_bac_ninh",
    "phone_code": "222"
  },
  {
    "code": "30",
    "name": "Hải Dương",
    "division_type": "tỉnh",
    "codename": "tinh_hai_duong",
    "phone_code": "220"
  },
  {
    "code": "31",
    "name": "Hải Phòng",
    "division_type": "thành phố trung ương",
    "codename": "thanh_pho_hai_phong",
    "phone_code": "225"
  },
  {
    "code": "33",
    "name": "Hưng Yên",
    "division_type": "tỉnh",
    "codename": "tinh_hung_yen",
    "phone_code": "221"
  },
  {
    "code": "34",
    "name": "Thái Bình",
    "division_type": "tỉnh",
    "codename": "tinh_thai_binh",
    "phone_code": "227"
  },
  {
    "code": "35",
    "name": "Hà Nam",
    "division_type": "tỉnh",
    "codename": "tinh_ha_nam",
    "phone_code": "226"
  },
  {
    "code": "36",
    "name": "Nam Định",
    "division_type": "tỉnh",
    "codename": "tinh_nam_dinh",
    "phone_code": "228"
  },
  {
    "code": "37",
    "name": "Ninh Bình",
    "division_type": "tỉnh",
    "codename": "tinh_ninh_binh",
    "phone_code": "229"
  },
  {
    "code": "38",
    "name": "Thanh Hóa",
    "division_type": "tỉnh",
    "codename": "tinh_thanh_hoa",
    "phone_code": "237"
  },
  {
    "code": "40",
    "name": "Nghệ An",
    "division_type": "tỉnh",
    "codename": "tinh_nghe_an",
    "phone_code": "238"
  },
  {
    "code": "42",
    "name": "Hà Tĩnh",
    "division_type": "tỉnh",
    "codename": "tinh_ha_tinh",
    "phone_code": "239"
  },
  {
    "code": "44",
    "name": "Quảng Bình",
    "division_type": "tỉnh",
    "codename": "tinh_quang_binh",
    "phone_code": "232"
  },
  {
    "code": "45",
    "name": "Quảng Trị",
    "division_type": "tỉnh",
    "codename": "tinh_quang_tri",
    "phone_code": "233"
  },
  {
    "code": "46",
    "name": "Thừa Thiên Huế",
    "division_type": "tỉnh",
    "codename": "tinh_thua_thien_hue",
    "phone_code": "234"
  },
  {
    "code": "48",
    "name": "Đà Nẵng",
    "division_type": "thành phố trung ương",
    "codename": "thanh_pho_da_nang",
    "phone_code": "236"
  },
  {
    "code": "49",
    "name": "Quảng Nam",
    "division_type": "tỉnh",
    "codename": "tinh_quang_nam",
    "phone_code": "235"
  },
  {
    "code": "51",
    "name": "Quảng Ngãi",
    "division_type": "tỉnh",
    "codename": "tinh_quang_ngai",
    "phone_code": "255"
  },
  {
    "code": "52",
    "name": "Bình Định",
    "division_type": "tỉnh",
    "codename": "tinh_binh_dinh",
    "phone_code": "256"
  },
  {
    "code": "54",
    "name": "Phú Yên",
    "division_type": "tỉnh",
    "codename": "tinh_phu_yen",
    "phone_code": "257"
  },
  {
    "code": "56",
    "name": "Khánh Hòa",
    "division_type": "tỉnh",
    "codename": "tinh_khanh_hoa",
    "phone_code": "258"
  },
  {
    "code": "58",
    "name": "Ninh Thuận",
    "division_type": "tỉnh",
    "codename": "tinh_ninh_thuan",
    "phone_code": "259"
  },
  {
    "code": "60",
    "name": "Bình Thuận",
    "division_type": "tỉnh",
    "codename": "tinh_binh_thuan",
    "phone_code": "252"
  },
  {
    "code": "62",
    "name": "Kon Tum",
    "division_type": "tỉnh",
    "codename": "tinh_kon_tum",
    "phone_code": "260"
  },
  {
    "code": "64",
    "name": "Gia Lai",
    "division_type": "tỉnh",
    "codename": "tinh_gia_lai",
    "phone_code": "269"
  },
  {
    "code": "66",
    "name": "Đắk Lắk",
    "division_type": "tỉnh",
    "codename": "tinh_dak_lak",
    "phone_code": "262"
  },
  {
    "code": "67",
    "name": "Đắk Nông",
    "division_type": "tỉnh",
    "codename": "tinh_dak_nong",
    "phone_code": "261"
  },
  {
    "code": "68",
    "name": "Lâm Đồng",
    "division_type": "tỉnh",
    "codename": "tinh_lam_dong",
    "phone_code": "263"
  },
  {
    "code": "70",
    "name": "Bình Phước",
    "division_type": "tỉnh",
    "codename": "tinh_binh_phuoc",
    "phone_code": "271"
  },
  {
    "code": "72",
    "name": "Tây Ninh",
    "division_type": "tỉnh",
    "codename": "tinh_tay_ninh",
    "phone_code": "276"
  },
  {
    "code": "74",
    "name": "Bình Dương",
    "division_type": "tỉnh",
    "codename": "tinh_binh_duong",
    "phone_code": "274"
  },
  {
    "code": "75",
    "name": "Đồng Nai",
    "division_type": "tỉnh",
    "codename": "tinh_dong_nai",
    "phone_code": "251"
  },
  {
    "code": "77",
    "name": "Bà Rịa - Vũng Tàu",
    "division_type": "tỉnh",
    "codename": "tinh_ba_ria_vung_tau",
    "phone_code": "254"
  },
  {
    "code": "79",
    "name": "Hồ Chí Minh",
    "division_type": "thành phố trung ương",
    "codename": "thanh_pho_ho_chi_minh",
    "phone_code": "28"
  },
  {
    "code": "80",
    "name": "Long An",
    "division_type": "tỉnh",
    "codename": "tinh_long_an",
    "phone_code": "272"
  },
  {
    "code": "82",
    "name": "Tiền Giang",
    "division_type": "tỉnh",
    "codename": "tinh_tien_giang",
    "phone_code": "273"
  },
  {
    "code": "83",
    "name": "Bến Tre",
    "division_type": "tỉnh",
    "codename": "tinh_ben_tre",
    "phone_code": "275"
  },
  {
    "code": "84",
    "name": "Trà Vinh",
    "division_type": "tỉnh",
    "codename": "tinh_tra_vinh",
    "phone_code": "294"
  },
  {
    "code": "86",
    "name": "Vĩnh Long",
    "division_type": "tỉnh",
    "codename": "tinh_vinh_long",
    "phone_code": "270"
  },
  {
    "code": "87",
    "name": "Đồng Tháp",
    "division_type": "tỉnh",
    "codename": "tinh_dong_thap",
    "phone_code": "277"
  },
  {
    "code": "89",
    "name": "An Giang",
    "division_type": "tỉnh",
    "codename": "tinh_an_giang",
    "phone_code": "296"
  },
  {
    "code": "91",
    "name": "Kiên Giang",
    "division_type": "tỉnh",
    "codename": "tinh_kien_giang",
    "phone_code": "297"
  },
  {
    "code": "92",
    "name": "Cần Thơ",
    "division_type": "thành phố trung ương",
    "codename": "thanh_pho_can_tho",
    "phone_code": "292"
  },
  {
    "code": "93",
    "name": "Hậu Giang",
    "division_type": "tỉnh",
    "codename": "tinh_hau_giang",
    "phone_code": "293"
  },
  {
    "code": "94",
    "name": "Sóc Trăng",
    "division_type": "tỉnh",
    "codename": "tinh_soc_trang",
    "phone_code": "299"
  },
  {
    "code": "95",
    "name": "Bạc Liêu",
    "division_type": "tỉnh",
    "codename": "tinh_bac_lieu",
    "phone_code": "291"
  },
  {
    "code": "96",
    "name": "Cà Mau",
    "division_type": "tỉnh",
    "codename": "tinh_ca_mau",
    "phone_code": "290"
  }
];

// Dữ liệu quận huyện của một số tỉnh thành phố lớn
const districts = {
  "01": [
    {
      "code": "001",
      "name": "Ba Đình",
      "division_type": "quận",
      "codename": "quan_ba_dinh",
      "province_code": "01"
    },
    {
      "code": "002",
      "name": "Hoàn Kiếm",
      "division_type": "quận",
      "codename": "quan_hoan_kiem",
      "province_code": "01"
    },
    {
      "code": "003",
      "name": "Tây Hồ",
      "division_type": "quận",
      "codename": "quan_tay_ho",
      "province_code": "01"
    },
    {
      "code": "004",
      "name": "Long Biên",
      "division_type": "quận",
      "codename": "quan_long_bien",
      "province_code": "01"
    },
    {
      "code": "005",
      "name": "Cầu Giấy",
      "division_type": "quận",
      "codename": "quan_cau_giay",
      "province_code": "01"
    },
    {
      "code": "006",
      "name": "Đống Đa",
      "division_type": "quận",
      "codename": "quan_dong_da",
      "province_code": "01"
    },
    {
      "code": "007",
      "name": "Hai Bà Trưng",
      "division_type": "quận",
      "codename": "quan_hai_ba_trung",
      "province_code": "01"
    },
    {
      "code": "008",
      "name": "Hoàng Mai",
      "division_type": "quận",
      "codename": "quan_hoang_mai",
      "province_code": "01"
    },
    {
      "code": "009",
      "name": "Thanh Xuân",
      "division_type": "quận",
      "codename": "quan_thanh_xuan",
      "province_code": "01"
    }
  ],
  "79": [
    {
      "code": "760",
      "name": "Quận 1",
      "division_type": "quận",
      "codename": "quan_1",
      "province_code": "79"
    },
    {
      "code": "761",
      "name": "Quận 12",
      "division_type": "quận",
      "codename": "quan_12",
      "province_code": "79"
    },
    {
      "code": "764",
      "name": "Gò Vấp",
      "division_type": "quận",
      "codename": "quan_go_vap",
      "province_code": "79"
    },
    {
      "code": "765",
      "name": "Bình Thạnh",
      "division_type": "quận",
      "codename": "quan_binh_thanh",
      "province_code": "79"
    },
    {
      "code": "766",
      "name": "Tân Bình",
      "division_type": "quận",
      "codename": "quan_tan_binh",
      "province_code": "79"
    },
    {
      "code": "767",
      "name": "Tân Phú",
      "division_type": "quận",
      "codename": "quan_tan_phu",
      "province_code": "79"
    },
    {
      "code": "768",
      "name": "Phú Nhuận",
      "division_type": "quận",
      "codename": "quan_phu_nhuan",
      "province_code": "79"
    },
    {
      "code": "769",
      "name": "Thủ Đức",
      "division_type": "thành phố",
      "codename": "thanh_pho_thu_duc",
      "province_code": "79"
    }
  ]
};

// Dữ liệu phường xã cơ bản cho một số quận huyện
const wards = {
  "001": [
    {
      "code": "00001",
      "name": "Phúc Xá",
      "division_type": "phường",
      "codename": "phuong_phuc_xa",
      "district_code": "001"
    },
    {
      "code": "00004",
      "name": "Trúc Bạch",
      "division_type": "phường",
      "codename": "phuong_truc_bach",
      "district_code": "001"
    },
    {
      "code": "00007",
      "name": "Vĩnh Phúc",
      "division_type": "phường",
      "codename": "phuong_vinh_phuc",
      "district_code": "001"
    }
  ],
  "760": [
    {
      "code": "26734",
      "name": "Bến Nghé",
      "division_type": "phường",
      "codename": "phuong_ben_nghe",
      "district_code": "760"
    },
    {
      "code": "26737",
      "name": "Bến Thành",
      "division_type": "phường",
      "codename": "phuong_ben_thanh",
      "district_code": "760"
    },
    {
      "code": "26740",
      "name": "Nguyễn Thái Bình",
      "division_type": "phường",
      "codename": "phuong_nguyen_thai_binh",
      "district_code": "760"
    }
  ]
};

module.exports = {
  provinces,
  districts,
  wards,
  
  // Hàm lấy tất cả tỉnh thành
  getProvinces: () => provinces,
  
  // Hàm lấy chi tiết tỉnh thành theo mã
  getProvinceByCode: (provinceCode) => {
    const province = provinces.find(p => p.code === provinceCode);
    if (!province) return null;
    
    return {
      ...province,
      districts: districts[provinceCode] || []
    };
  },
  
  // Hàm lấy quận huyện theo mã tỉnh
  getDistrictsByProvince: (provinceCode) => {
    return districts[provinceCode] || [];
  },
  
  // Hàm lấy phường xã theo mã quận huyện
  getWardsByDistrict: (districtCode) => {
    return wards[districtCode] || [];
  },
  
  // Hàm lấy chi tiết quận huyện theo mã
  getDistrictByCode: (districtCode) => {
    // Tìm trong mỗi tỉnh
    for (const provinceCode in districts) {
      const district = districts[provinceCode].find(d => d.code === districtCode);
      if (district) {
        return {
          ...district,
          wards: wards[districtCode] || []
        };
      }
    }
    return null;
  }
};