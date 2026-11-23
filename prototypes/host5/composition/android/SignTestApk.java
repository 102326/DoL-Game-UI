import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.util.List;

class SignTestApk {
    public static void main(String[] args) throws Exception {
        char[] password = System.getenv("SF_APK_KEY_PASS").toCharArray();
        KeyStore keys = KeyStore.getInstance("PKCS12");
        try (InputStream input = Files.newInputStream(Path.of(args[0]))) {
            keys.load(input, password);
        }
        var key = (KeyStore.PrivateKeyEntry) keys.getEntry("sf-neutral", new KeyStore.PasswordProtection(password));
        var certificate = (X509Certificate) key.getCertificate();
        var signer = new ApkSigner.SignerConfig.Builder("sf-neutral", key.getPrivateKey(), List.of(certificate)).build();
        File output = new File(args[2]);
        new ApkSigner.Builder(List.of(signer))
            .setInputApk(new File(args[1]))
            .setOutputApk(output)
            .setV1SigningEnabled(false)
            .setV2SigningEnabled(true)
            .setV3SigningEnabled(false)
            .build().sign();
        var result = new ApkVerifier.Builder(output).build().verify();
        if (!result.isVerified() || !result.isVerifiedUsingV2Scheme()
            || !result.getSignerCertificates().equals(List.of(certificate))) {
            throw new IllegalStateException("Test APK signature did not verify");
        }
    }
}
