
// Program Fungsi Hybrid AES-RSA - Aplikasi DRM STUDIO TV UAD


// Parameter Algoritma RSA dan AES:
var AlgoritmaRSA = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: "SHA-256" }
};
var AlgoritmaAES = {
    name: "AES-GCM",
    length: 256
};
var aesIVLength = 12;

// Menghasilkan Pasangan Kunci (Untuk Algoritma Asimetris Kunci Publik RSA): 
var BuatkunciRSA = function () {
    return crypto.subtle.generateKey(AlgoritmaRSA, true,  ["wrapKey", "unwrapKey"])
        .catch(function (error) { throw "Kesalahan Generate Kunci."; })
        .then(function (KunciRSA) {
            var exportKunciPublik = crypto.subtle.exportKey("spki", KunciRSA.publicKey)
                .catch(function (error) { throw "Kesalahan Mengekspor Kunci Publik."; });
            var exportKunciPrivat = crypto.subtle.exportKey("pkcs8", KunciRSA.privateKey)
                .catch(function (error) { throw "Kesalahan Mengekspor Kunci Pribadi."; });
            return Promise.all([exportKunciPublik, exportKunciPrivat])
                .then(function (kunci) { return { publicKeyBuffer: kunci[0], privateKeyBuffer: kunci[1] }; });
        });
};

// Menjalankan Serangkaian Fungsi Enkripsi RSA-AES, Impor Kunci dan Proses Wrapkey Kunci AES-RSA: 
var enkripsiRSA = function (video, KunciPublikRSABuffer) {
    var importKunciPublikRSA = crypto.subtle.importKey("spki", KunciPublikRSABuffer, AlgoritmaRSA, false, ["wrapKey"])
        .catch(function (error) { throw "Kesalahan Mengimpor Kunci Publik."; });
    var generateKunciAES = crypto.subtle.generateKey(AlgoritmaAES, true, ["encrypt"])
        .catch(function (error) { throw "Kesalahan Generate Kunci Simetris."; });

    return Promise.all([importKunciPublikRSA, generateKunciAES])
        .then(function (kunci) {
            var KunciPublikRSA = kunci[0], kunciAES = kunci[1];
            var aesIV = crypto.getRandomValues(new Uint8Array(aesIVLength));
            var initializedAlgoritmaAES = Object.assign({ iv: aesIV }, AlgoritmaAES);

// Pembungkusan Kunci AES Yang Sudah di Hasilkan Untuk Enkrip Data:
            var wrapkunciAES = crypto.subtle.wrapKey("raw", kunciAES, KunciPublikRSA, AlgoritmaRSA)
                .catch(function (error) { throw "Kesalahan Menenkripsi Kunci Simetris."; });
            var enkripsiVideo = crypto.subtle.encrypt(initializedAlgoritmaAES, kunciAES, video)
                .catch(function (error) { throw "Kesalahan Mengenkripsi Data."; });

// Menjalankan Serangkaian Perintah Wrapkey AES Yang Digunakan Untuk Enkripsi Data:
            return Promise.all([wrapkunciAES, enkripsiVideo])
                .then(function (buffers) {
                    var wrappedkunciAES = new Uint8Array(buffers[0]), fileVideoTerenkripsi = new Uint8Array(buffers[1]);
                    var encryptionState = new Uint8Array(wrappedkunciAES.length + aesIV.length + fileVideoTerenkripsi.length);
                    encryptionState.set(wrappedkunciAES, 0);
                    encryptionState.set(aesIV, wrappedkunciAES.length);
                    encryptionState.set(fileVideoTerenkripsi, wrappedkunciAES.length + aesIV.length);
                    return encryptionState.buffer;
                });
        });
};

// Menjalankan Serangkaian Fungsi Dekripsi AES-RSA, Import Kunci dan Unwrapkey AES-RSA:
var dekripsiRSA = function (video, KunciPrivatRsaBuffer) {
    return crypto.subtle.importKey("pkcs8", KunciPrivatRsaBuffer, AlgoritmaRSA, false, ["unwrapKey"])
        .catch(function (error) { throw "Kesalahan Mengimpor Kunci Pribadi."; })
        .then(function (KunciRSA) {
            var wrappedkunciAESLength = AlgoritmaRSA.modulusLength / 8;
            var wrappedkunciAES = new Uint8Array(video.slice(0, wrappedkunciAESLength));
            var aesIV = new Uint8Array(video.slice(wrappedkunciAESLength, wrappedkunciAESLength + aesIVLength));
            var initializedAlgoritmaAES = Object.assign({ iv: aesIV }, AlgoritmaAES);

// Menjalankan Proses Unwrapkey Kunci AES Yang Akan Digunkan Untuk Dekripsi Data (File Video):
            return crypto.subtle.unwrapKey("raw", wrappedkunciAES, KunciRSA, AlgoritmaRSA, initializedAlgoritmaAES, false, ["decrypt"])
                .catch(function (error) { throw "Kesalahan Mendekripsi Kunci Simetris." })
                .then (function (kunciAES) {
                    var fileVideoTerenkripsi = new Uint8Array(video.slice(wrappedkunciAESLength + aesIVLength));

                    return crypto.subtle.decrypt(initializedAlgoritmaAES, kunciAES, fileVideoTerenkripsi)
                        .catch(function (error) { throw "Kesalahan Mendekripsi Data." });
                });
        });
};
