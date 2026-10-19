using System;
using System.Collections.Generic;
using System.Speech.Synthesis;
using System.Web.Script.Serialization;
namespace SelectSpeak {
  public static class SpeechBridge {
    private static readonly object Gate = new object();
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    private static readonly Dictionary<Prompt, long> Pending = new Dictionary<Prompt, long>();
    private static void Emit(object value) { lock (Gate) { Console.WriteLine(Json.Serialize(value)); Console.Out.Flush(); } }
    public static void Run() {
      using (var synth = new SpeechSynthesizer()) {
        synth.SetOutputToDefaultAudioDevice();
        var voices = new List<object>();
        foreach (var installed in synth.GetInstalledVoices()) {
          if (!installed.Enabled) continue;
          var v = installed.VoiceInfo;
          voices.Add(new { name = v.Name, culture = v.Culture.Name, gender = v.Gender.ToString() });
        }
        var initialVoice = synth.Voice.Name;
        synth.SpeakCompleted += delegate(object sender, SpeakCompletedEventArgs e) {
          long id;
          lock (Gate) { if (!Pending.TryGetValue(e.Prompt, out id)) return; Pending.Remove(e.Prompt); }
          Emit(new { type = e.Error == null ? "done" : "error", id = id, cancelled = e.Cancelled, message = e.Error == null ? "" : e.Error.Message });
        };
        Emit(new { type = "ready", voices = voices });
        string line;
        while ((line = Console.ReadLine()) != null) {
          long id = 0;
          try {
            var command = Json.Deserialize<Dictionary<string, object>>(line);
            var action = Convert.ToString(command["type"]);
            if (action == "quit") break;
            if (action == "stop") { synth.SpeakAsyncCancelAll(); continue; }
            if (action != "speak") continue;
            id = Convert.ToInt64(command["id"]);
            synth.SpeakAsyncCancelAll();
            var voice = Convert.ToString(command["voice"]);
            synth.SelectVoice(String.IsNullOrEmpty(voice) ? initialVoice : voice);
            synth.Rate = Convert.ToInt32(command["rate"]);
            var prompt = new Prompt(Convert.ToString(command["text"]));
            lock (Gate) { Pending[prompt] = id; }
            synth.SpeakAsync(prompt);
            Emit(new { type = "speaking", id = id });
          } catch (Exception error) { Emit(new { type = "error", id = id, message = error.Message }); }
        }
        synth.SpeakAsyncCancelAll();
      }
    }
  }
}
