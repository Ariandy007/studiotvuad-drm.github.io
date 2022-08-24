/* Saat Kunci Dihasilkan Untuk Digunakan Enkripsi ataupun Dekripsi Data, Program Ini Akan Memproses Format Data Kunci.

   Program Ini Terdiri Dari Serangkain Proses Encoding, Yaitu: */

// 1. Kode Program Encoding PEM (Privacy Enhanced Mail) Ke Base64

var pemToBase64String = function (value, label) {
    var lines = value.split("\n");
    var base64String = "";

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("-----")) continue;
        base64String += lines[i];
    }

    return base64String;
};

// 2. Kode Program Encoding Base64 Ke ArrayBuffer 

var base64StringToArrayBuffer = function (value) {
    var byteString = atob(value);
    var byteArray = new Uint8Array(byteString.length); 

    for (var i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    return byteArray.buffer;
};

// 3. Kode Program Encoding Base64 ke PEM (Privacy Enhanced Mail)
//    Format Kunci RSA Yang Akan di Tampilkan Aplikasi Dalam Format PEM:   (Miasalnya di Awali Dengan "Begin" dan "END")

var base64StringToPem = function (value, label) {
    var pem = "-----STUDIO TV UAD {0} AWAL-----\n".replace("{0}", label);

    for (var i = 0; i < value.length; i += 64) {
        pem += value.substr(i, 64) + "\n";
    }

    pem += "-----STUDIO TV UAD {0} AKHIR-----\n".replace("{0}", label);

    return pem;
};

// 4. Kode Program Konversi arrayBuffer ke Base64String

var arrayBufferToBase64String = function (value) {
    var byteArray = new Uint8Array(value);
    var byteString = "";

    for (var i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }

    return btoa(byteString);
};

// 5. Kode Program Encoding PEM Ke ArrayBuffer
var pemToArrayBuffer = function (value) {
    return base64StringToArrayBuffer(pemToBase64String(value));
};

var arrayBufferToPem = function (value, label) {
    return base64StringToPem(arrayBufferToBase64String(value), label);
};
